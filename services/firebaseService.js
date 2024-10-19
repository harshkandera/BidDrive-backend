const admin = require('firebase-admin');
const {db} = require('../config/firebaseConfig');




/**
 * Generalized function to send FCM notifications.
 *
 * @param {string} target - The topic or device token(s) to send the notification to.
 * @param {string} title - The title of the notification.
 * @param {string} body - The body message of the notification.
 * @param {object} [data={}] - Optional additional data to send with the notification.
 * @returns {Promise<void>}
 */

async function sendNotification(target, title, body, data = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: data, // Optional data payload
  };

  // Check if the target is a topic or an array of device tokens
  if (target.startsWith('car_') || target.startsWith('topic_')) {
    message.topic = target; // For topics (e.g., `car_123`, `topic_notifications`)
  } else {
    message.token = target; // For single device token
  }

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

module.exports = { sendNotification };



async function updateHighestBid({ carId, bidAmount, userId }) {
  
  // console.log('carId:', carId, 'bidAmount:', bidAmount, 'userId:', userId);

  const carBidRef = db.ref(`cars/${carId}`);

  try {
    const snapshot = await carBidRef.once('value');
    const currentData = snapshot.val();

    if (currentData === null) {

      await carBidRef.set({ highestBid: bidAmount, userId: userId });

      console.log('Highest bid successfully updated to:', bidAmount);

    } else if (bidAmount > currentData.highestBid) {

      await carBidRef.update({ highestBid: bidAmount, userId: userId });

      console.log('Highest bid successfully updated to:', bidAmount);
    } else {

      console.log('Bid was not higher, transaction aborted');

    }
  } catch (error) {
    console.error('Transaction failed: ', error);
  }
}

module.exports = {updateHighestBid, sendNotification};