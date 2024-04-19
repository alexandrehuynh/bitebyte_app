const firebase = require('firebase/app');
require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyBnV3L6TzZJ4M_mdGoD55YlZRjDLxjxpQg",
  authDomain: "bitebyte-app.firebaseapp.com",
  databaseURL: "https://bitebyte-app-default-rtdb.firebaseio.com",
  projectId: "bitebyte-app",
  storageBucket: "bitebyte-app.appspot.com",
  messagingSenderId: "321301766006",
  appId: "1:321301766006:web:1df34c8d8e03045ce9e457",
  measurementId: "G-XFFG0RZKG9"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

module.exports = { database };
