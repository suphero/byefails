const mongoose = require('mongoose');

const CategorySchema = mongoose.Schema({
  _id: Number,
  name: String,
  price: Number
});

module.exports = mongoose.model('Category', CategorySchema, 'categories');
