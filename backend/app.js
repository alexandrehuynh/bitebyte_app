require('dotenv').config();
const express = require('express');
const fs = require('fs');
const API_Key = process.env.API_Key;

// COnfiguring Multer (middleware multipart/form-data) 
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // This will save files to a folder named 'uploads'

// Configuring Gemini Pro 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(API_Key);


// configuring port
const app = express();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.post('/analyze-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const imageBase64 = Buffer.from(fs.readFileSync(req.file.path)).toString('base64');
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const prompt = `
      Identify the dish in the image. 
      List all visible ingredients. 
      For each ingredient, provide its approximate caloric content and macronutrient breakdown (carbohydrates, fats, proteins). 
      Also, calculate the total caloric content and overall macronutrient composition of the entire dish.
    `;

    const imageData = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg' // adjust the mime type based on the actual image format
      }
    };

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      data: text
    });

  }catch (error) {
    // This line will log the error to the console if an exception is caught
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing image'
    });
  } finally {
    // Clean up the uploaded file
    if (req.file) fs.unlinkSync(req.file.path);
  }
});