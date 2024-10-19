const mongoose = require('mongoose');

// Define the schema for a single bid
const BidDetailSchema = new mongoose.Schema({

  bidAmount: {
    type: Number,
    required: true,
  },
  bid_time: {
    type: Date,
    default: Date.now,
  },
}, { _id: false }); 


const BidSchema = new mongoose.Schema({

  car_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bids: [BidDetailSchema],
  invoices: [{ type: String }],
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed' , 'winner'],
    required: true,
  }
}, {
  timestamps: true 
});

module.exports = mongoose.model('Bid', BidSchema);


