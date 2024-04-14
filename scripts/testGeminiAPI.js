require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); // Use the API key directly

function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
  const prompt = `
  Identify the dish in the image. 
  List all visible ingredients. 
  For each ingredient, provide its approximate caloric content and macronutrient breakdown (carbohydrates, fats, proteins). 
  Also, calculate the total caloric content and overall macronutrient composition of the entire dish.
`;
  const imageParts = [
    fileToGenerativePart("assets/images/burger.jpg", "image/png")
  ];

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    console.log(text);
  } catch (error) {
    console.error('Error:', error);
  }
}

run();