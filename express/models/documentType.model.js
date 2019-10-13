const mongoose = require('mongoose');

const DocumentTypeSchema = mongoose.Schema({
  _id: Number,
  name: String,
  multiplier: Number
});

module.exports = mongoose.model('DocumentType', DocumentTypeSchema, 'documentTypes');
