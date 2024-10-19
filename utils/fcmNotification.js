const { messaging } = require('../config/firebaseConfig'); // Ensure correct path

const sendPushNotification = async (token, title, body , image) => {
  try {
    // console.log(token)
    if (!token) {
      throw new Error("FCM token is required");
    }

    const message = {
      token, // Ensure this is a valid FCM token
      notification: {
        title,
        body,
        image
      },
    };

    // Send the message
    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

module.exports = { sendPushNotification };
