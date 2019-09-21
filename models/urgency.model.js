const mongoose = require('mongoose');

const UrgencySchema = mongoose.Schema({
  _id: Number,
  name: String,
  hours: Number,
  multiplier: Number
});

module.exports = mongoose.model('Urgency', UrgencySchema, 'urgencies');
