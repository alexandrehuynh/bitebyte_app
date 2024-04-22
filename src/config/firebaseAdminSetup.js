const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");  // Update this path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bitebyte-app-default-rtdb.firebaseio.com/" 
});

module.exports = admin;
