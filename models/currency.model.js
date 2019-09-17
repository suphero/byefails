const mongoose = require('mongoose');

const CurrencySchema = mongoose.Schema({
  _id: String,
  name: String,
  multiplier: Number,
  precision: Number
});

module.exports = mongoose.model('Currency', CurrencySchema, 'currencies');
