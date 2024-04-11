const fs = require('fs');

// Function to convert image to Base64
function convertImageToBase64(path) {
    // Read binary data from image file
    const bitmap = fs.readFileSync(path);
    // Convert binary data to base64 encoded string
    return Buffer.from(bitmap).toString('base64');
}

const imageBase64 = convertImageToBase64('assets/images/image.jpg');
console.log(imageBase64);
