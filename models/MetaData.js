const mongoose = require("mongoose");

const Metadata = new mongoose.Schema({
  MakesModels: [
    {
      Make: {
        type: String,
      },
      Models: [
        {
          type: String,
        },
      ],
    },
  ],
  BodyColors: [
    {
      type: String,
    },
  ],
  BodyTypes: [
    {
      type: String,
    },
  ],
});

module.exports = mongoose.model("Meta", Metadata);
