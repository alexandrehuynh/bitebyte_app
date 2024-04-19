require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require('firebase-admin');

// Import Firebase configuration from your module
const serviceAccount = require('../serviceAccountKey.json'); 

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bitebyte-app-default-rtdb.firebaseio.com" 
});

const database = admin.database(); // Get a reference to the database service

const parseNutritionalData = require('./services/parseNutritionalData');
const { getFoodDatabaseInfo, getNutritionalAnalysis } = require('../src/api/edamam');

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function cleanJsonText(rawText) {
  // Removes Markdown code block syntax and trims any unwanted whitespace
  return rawText.replace(/^[^{\[]+|[^}\]]+$/g, '').trim(); // Removes anything before the first { or [ and after the last } or ]
}

function isValidJson(jsonString) {
  try {
      const data = JSON.parse(jsonString);
      if (!data.dish || !Array.isArray(data.ingredients) || !data.totalNutrition) {
          throw new Error("JSON structure does not meet expected format.");
      }
      data.ingredients.forEach(ingredient => {
          if (typeof ingredient.weight !== "number") {  // Checking for numeric weight
              console.error(`Invalid weight format for ingredient:`, ingredient);
              throw new Error("Weight must be numeric.");
          }
      });
      return true;
  } catch (e) {
      console.error("Invalid JSON:", e);
      return false;
  }
}

// app. functions
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post('/analyze-image', upload.single('image'), async (req, res) => {
  let responseToSend = { success: false, error: 'An error occurred' };

  if (!req.file) {
    responseToSend.error = 'No file uploaded.';
    return res.status(400).json(responseToSend);
  }

  try {
      const imageBase64 = Buffer.from(fs.readFileSync(req.file.path)).toString('base64');
      const imageData = {
          inlineData: {
              data: imageBase64,
              mimeType: 'image/jpeg'
          }
      };

      const prompt = `
      Analyze the provided image and accurately identify each food item. 
      Use visual recognition to estimate portion sizes, comparing them to known objects in the image or by referencing common serving sizes. 
      Output the nutritional information in a structured JSON format, based closely on standard nutritional databases. 
      Ensure all numerical values for weights and measures are provided in decimals without unit descriptions (e.g., '100', '50.5', not '100g', '1/2 cup'). 
      When encountering ambiguous items, ask for user input or provide a range of estimated values. 
      Consider the typical preparation methods and ingredients that are characteristic of the cuisine type depicted. 
      Include potential cooking additives such as oils and condiments in your estimation. 
      Acknowledge that the macronutrient content can vary with different cooking methods and recipe variations. 
      Regularly update estimations based on a feedback loop with user corrections to refine accuracy over time. 
      The following JSON structure should be used for displaying the nutritional information:
      
      {
        "dish": "Identified name of the dish from the image",
        "ingredients": [
          {
            "name": "Commonly known ingredient name",
            "weight": "Exact weight of the ingredient in the dish in grams, expressed as a decimal",
            "calories": "Total calories for the specified weight, numeric value only",
            "macronutrients": {
              "fat": "Total fat in grams for the specified weight, numeric value only",
              "carbohydrates": "Total carbohydrates in grams for the specified weight, numeric value only",
              "protein": "Total protein in grams for the specified weight, numeric value only"
            }
          }
          // ... other ingredients
        ],
        "totalNutrition": {
          "calories": "Sum of calories from all ingredients in the dish, numeric value only",
          "fat": "Sum of fat in grams from all ingredients, numeric value only",
          "carbohydrates": "Sum of carbohydrates in grams from all ingredients, numeric value only",
          "protein": "Sum of protein in grams from all ingredients, numeric value only"
        }
      }
      
      Focus on the accuracy of macronutrient identification and quantification. Adhere to the nutritional values for these ingredients as known from reliable sources and databases. Avoid assumptions and overestimations; if in doubt, prioritize user interaction for clarification.
      `;
      
      const result = await genAI.getGenerativeModel({ model: "gemini-pro-vision" }).generateContent([prompt, imageData]);
      const response = await result.response;
      let rawText = await response.text();  // Await the Promise returned by text()

      console.log("Raw API Response Text:", rawText);
      let cleanText = cleanJsonText(rawText);
      console.log("Clean API Response Text:", cleanText);

      if (!isValidJson(cleanText)) {
        console.error("JSON validation failed.");
        return res.status(400).json({
            success: false,
            error: 'JSON does not meet the required structure or format'
        });
    }

      const jsonData = JSON.parse(cleanText);
      const structuredData = parseNutritionalData(jsonData);

      // // Initialize an object to store the enhanced data
      // let enhancedData = {
      //   ...structuredData,
      //   enhancedIngredients: []
      // };

      // // Loop through each ingredient from the Gemini data
      // for (const ingredient of structuredData.ingredients) {
      // try {
      //   // Cross-reference with Edamam's Food Database API
      //   const foodInfo = await getFoodDatabaseInfo(ingredient.name);
      //   // Retrieve nutritional data using Edamam's Nutrition Analysis API
      //   const nutritionalData = await getNutritionalAnalysis(foodInfo.foodId);

      //   // Add the enhanced data to the enhancedData object
      //   enhancedData.enhancedIngredients.push({
      //     ...ingredient,
      //     foodInfo: foodInfo, // Details from the Food Database API
      //     nutritionalData: nutritionalData // Nutritional details from the Nutrition Analysis API
      //   });
      // } catch (error) {
      //   console.error(`Error processing ingredient ${ingredient.name}:`, error);
      //   // Handle the error appropriately
      // }
      // }

      // Save to Firebase
      const newDataKey = database.ref('dishes').push().key;
      database.ref('dishes/' + newDataKey).set(structuredData, function(error) {
          if (error) {
              console.error("Firebase data could not be saved." + error);
              return res.status(500).json({ success: false, error: 'Firebase data could not be saved.' });
          } else {
              console.log("Firebase data saved successfully.");
              res.json({
                  success: true,
                  firebaseKey: newDataKey,
                  data: structuredData
              });
          }
      });;
  } catch (error) {
    console.error("Error:", error);

    // If cleanText is defined, log it to help diagnose issues
    if (typeof cleanText !== 'undefined') {
      console.log("Problematic JSON text:", cleanText);
    }

    responseToSend.error = 'Server error processing image';
    return res.status(500).json(responseToSend);

  } finally {
    // Safely attempt to delete the file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});


module.exports = app; // If needed for testing