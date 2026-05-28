const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  supermarket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supermarket',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);