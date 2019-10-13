const mongoose = require('mongoose');

const SpacingSchema = mongoose.Schema({
  _id: Number,
  name: String,
  words: Number,
  priceMultiplier: Number
});

module.exports = mongoose.model('Spacing', SpacingSchema, 'spacings');