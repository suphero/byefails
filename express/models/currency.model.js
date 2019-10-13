const mongoose = require('mongoose');

const CurrencySchema = mongoose.Schema({
  _id: String,
  name: String,
  multiplier: Number,
  precision: Number,
  icon: String
});

module.exports = mongoose.model('Currency', CurrencySchema, 'currencies');
