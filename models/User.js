const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstname: {
      type: String,
      trim: true,
    },
    lastname: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
    },
    phone: {
      type: String,
    },
    street: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pincode: {
      type: String,
    },
    country: {
      type: String,
    },
    companyName: {
      type: String,
    },
    cart: [
      {
        carId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Car",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    accountType: {
      type: String,
      enum: ["Admin", "User"],
      default: "User",
    },
    fcmToken: { type: String },
    isSubscribedToNotifications: { type: Boolean, default: false },
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
      },
    ],
    biddingHistory: [
      {
        bidId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Bid",
        },
      },
    ],
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
