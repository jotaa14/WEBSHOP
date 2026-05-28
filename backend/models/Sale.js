const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  supermarket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supermarket',
    required: true
  },
  items: {
    type: [saleItemSchema],
    validate: {
      validator: function (value) {
        return Array.isArray(value) && value.length > 0;
      },
      message: 'A venda tem de ter pelo menos um produto.'
    }
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled'],
    default: 'completed'
  },
  cancellationReason: {
    type: String,
    default: null
  },
  returnCondition: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);