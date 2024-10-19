// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    image:{type:String}
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
