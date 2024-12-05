const mongoose = require("mongoose");

const CarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    images: [
      {
        fileurl: {
          type: String,
        },
      },
    ],
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    minimumBidDifference: {
      type: Number,
      default: 100,
    },
    bids: [
      {
        bidId: { type: mongoose.Schema.Types.ObjectId, ref: "Bid" },
      },
    ],
    highestBid: {
      type: Number,
    },
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    totalBids: {
      type: Number,
      default: 0,
    },
    vehicleFeatures: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Features",
    },
    status: {
      type: String,
      enum: ["draft", "live", "past"],
      default: "draft",
    },
    category: {
      type: { type: String, enum: ["cars", "construction"], required: true },
      subcategory: {
        type: String,
      },
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    step1: {
      type: Boolean,
      default: false,
    },
    step2: {
      type: Boolean,
      default: false,
    },
    step3: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CarSchema.index({ endTime: 1, status: 1 });
CarSchema.index({ highestBid: 1 }); 
CarSchema.index({ created_at: 1 });
CarSchema.index({ updatedAt: 1 });

module.exports = mongoose.model("Car", CarSchema);
