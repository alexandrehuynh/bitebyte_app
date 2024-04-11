const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' })); // Increase the payload limit to handle large Base64 strings

app.post('/analyze-image', async (req, res) => {
  try {
    const { imageData } = req.body; // Access the Base64 encoded data sent in the request body

    // Optional: Convert Base64 back to an image file, if necessary
    // const buffer = Buffer.from(imageData, 'base64');
    // fs.writeFileSync('path/to/save/image.jpg', buffer);

    // Process the image data here (e.g., calling an AI service)

    // Mock response
    res.json({
      success: true,
      data: {
        message: 'Image processed',
        nutritionalInfo: {/* processed data */}
      }
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing image'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
