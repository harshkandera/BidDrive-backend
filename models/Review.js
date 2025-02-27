const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
      default: 5,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    media: {
      type: String,
      default: null,
    },
    videoUrl: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    reviewCount: {
      type: Number,
      default: 1,
    }
  }, {
    timestamps: true 
  });
  

  module.exports = mongoose.model('Review', testimonialSchema);