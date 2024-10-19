const mongoose = require("mongoose");

const FeaturesSchema = new mongoose.Schema({
  vehicleInformation: {
    registration_year: { type: Number },
    make: { type: String },
    model: { type: String },
    trim: { type: String },
    kms_driven: { type: Number },
    no_of_owners: { type: Number },
    fuel_type: { type: String },
    transmission: { type: String },
    body_type: { type: String },
    color: { type: String },
    location: { type: String },
    mileage: { type: Number },
  },

  optionsFeature: [
    {
      feature: { type: String },
      value: { type: String },
    },
  ],

  technicalFeature: [
    {
      feature: { type: String },
      value: { type: String },
    },
  ],
  damages: [
    {
      feature: { type: String },
      value: { type: String },
    },
  ],

  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Features", FeaturesSchema);
