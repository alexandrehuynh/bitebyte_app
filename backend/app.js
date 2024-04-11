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
      Analyze the provided image and output the nutritional information directly in a structured JSON format. Please ensure the response adheres strictly to the following JSON structure:
  
      {
        "dish": "Name of the dish",
        "ingredients": [
          {
            "name": "Ingredient name",
            "quantity": "Quantity if applicable, numbers only, no units",
            "calories": "Numeric value of calories, no units",
            "macronutrients": {
              "fat": "Numeric value of fat in grams, no units",
              "carbohydrates": "Numeric value of carbohydrates in grams, no units",
              "protein": "Numeric value of protein in grams, no units"
            }
          }
        ],
        "totalNutrition": {
          "calories": "Total numeric value of calories, no units",
          "fat": "Total fat in grams, numeric, no units",
          "carbohydrates": "Total carbohydrates in grams, numeric, no units",
          "protein": "Total protein in grams, numeric, no units"
        }
      }
  
      Please include all nutritional details explicitly as per this structure and ensure all numeric values are provided without any units attached to facilitate straightforward JSON parsing.
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
