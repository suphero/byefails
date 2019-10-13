const mongoose = require('mongoose');

const ExtraSchema = mongoose.Schema({
  _id: Number,
  name: String,
  price: Number,
  perPage: Boolean
});

module.exports = mongoose.model('Extra', ExtraSchema, 'extras');