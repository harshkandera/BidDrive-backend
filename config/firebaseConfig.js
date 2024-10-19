const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Update the path

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://movie-e7e4e-default-rtdb.asia-southeast1.firebasedatabase.app"  // Update with your Firebase database URL
});

const db = admin.database();
const messaging = admin.messaging();
 

module.exports = {db , messaging};


