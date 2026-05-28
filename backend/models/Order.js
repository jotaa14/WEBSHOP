const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supermarket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supermarket',
    required: true
  },
  courier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deliveryMethod: {
    type: String,
    enum: ['pickup', 'courier'],
    default: 'courier'
  },
  deliveryCost: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryDistrict: {
    type: String,
    default: '',
    trim: true
  },
  items: {
    type: [orderItemSchema],
    validate: {
      validator: function (value) {
        return Array.isArray(value) && value.length > 0;
      },
      message: 'A encomenda tem de ter pelo menos um produto.'
    }
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'delivering', 'delivered', 'cancelled'],
    default: 'pending'
  },
  courierReview: {
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    },
    createdAt: {
      type: Date,
      default: null
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);