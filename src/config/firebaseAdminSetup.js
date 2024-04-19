const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");  // Update this path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"  // Replace 'your-project-id' with the actual project ID
});

module.exports = admin;
