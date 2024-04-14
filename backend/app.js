require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Import the parseNutritionalData function from its module
const parseNutritionalData = require('./services/parseNutritionalData');

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
          if (typeof ingredient.quantity !== "number") {  // Checking for numeric quantity
              console.error(`Invalid quantity format for ingredient:`, ingredient);
              throw new Error("Quantity must be numeric.");
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
  if (!req.file) {
      return res.status(400).send('No file uploaded.');
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
      Output the nutritional information directly in a structured JSON format, adhering closely to standard nutritional databases. 
      Convert all fractions to decimals for consistency and ensure that the macronutrient breakdown aligns with verified data sources. 
      Focus on realistic serving sizes and avoid exaggerating quantities or nutritional values.
      The image is expected to contain food items commonly found in nutritional databases. 
      Accurately identify the dish and each ingredient based on visual analysis. 
      Provide all quantities in decimal numerical format without any unit descriptions (e.g., '1', '0.5', not '1/2 cup', '2 slices') 
      and convert any fractions to decimal format to ensure consistency and precision in measurements.
      Provide a detailed breakdown of macronutrients. Structure the response as follows:      
      
      {
        "dish": "Name of the dish, clearly identified from the image",
        "ingredients": [
          {
            "name": "Ingredient name, as commonly known",
            "quantity": "Exact numerical quantity present in the dish, expressed in decimal format, without any unit description",
            "calories": "Total calories for the quantity present, numeric value only",
            "macronutrients": {
              "fat": "Total fat in grams for the quantity present, numeric value only",
              "carbohydrates": "Total carbohydrates in grams for the quantity present, numeric value only",
              "protein": "Total protein in grams for the quantity present, numeric value only"
            }
          }
        ],
        "totalNutrition": {
          "calories": "Total calories of the complete dish, numeric value only",
          "fat": "Sum of all fats in the dish in grams, numeric value only",
          "carbohydrates": "Sum of all carbohydrates in the dish in grams, numeric value only",
          "protein": "Sum of all proteins in the dish in grams, numeric value only"
        }
      }
  
      Emphasize accuracy in the identification and quantification of ingredients. 
      Ensure that the macronutrient breakdown adheres to typical values known for these ingredients in standard nutritional databases.
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
      
      return res.json({
          success: true,
          data: structuredData
        });
      } catch (error) {
        console.error("Error:", error);
        
        // Check if cleanText is available before logging it
        if (typeof cleanText !== 'undefined') {
          console.log("Problematic JSON text:", cleanText);
        }
        
        return res.status(500).json({
          success: false,
          error: 'Server error processing image'
        });
  } finally {
    // Safely attempt to delete the file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
}
});
