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
const API_Key = process.env.API_Key;
const genAI = new GoogleGenerativeAI(API_Key);

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
      Analyze the provided image and output the nutritional information directly in a structured JSON format. 
      The image is expected to contain food items commonly found in nutritional databases. 
      Accurately identify the dish and each ingredient based on visual analysis, and provide a detailed breakdown of macronutrients. 
      Please structure the response as follows:
  
      {
        "dish": "Name of the dish, clearly identified from the image",
        "ingredients": [
          {
            "name": "Ingredient name, as commonly known",
            "quantity": "Estimated quantity present in the dish, numbers only, no units",
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
      let rawText = response.text();  // This gets the JSON string from API

      // Debugging the raw text
      console.log("Raw API Response Text:", rawText);

      // Clean the text to remove Markdown code block syntax
      cleanText = rawText.replace(/```json\n/g, '').replace(/```/g, '');

      // Debugging the clean text
      console.log("Raw API Response Text:", cleanText); 

      const jsonData = JSON.parse(cleanText); // Parse the cleaned JSON string
      const structuredData = parseNutritionalData(jsonData);

      res.json({
          success: true,
          data: structuredData
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
          success: false,
          error: 'Server error processing image'
      });
  } finally {
      if (req.file) fs.unlinkSync(req.file.path);
  }
});
