const mongoose = require('mongoose');

const UrgencySchema = mongoose.Schema({
  _id: Number,
  name: String,
  price: Number,
  hours: Number
});

module.exports = mongoose.model('Urgency', UrgencySchema, 'urgencies');
