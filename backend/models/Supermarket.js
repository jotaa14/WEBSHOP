const mongoose = require('mongoose');

const supermarketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  deliveryMethods: {
    type: [String],
    enum: ['pickup', 'courier'],
    default: ['pickup']
  },
  pickupCost: {
    type: Number,
    default: 0,
    min: 0
  },
  courierCost: {
    type: Number,
    default: 0,
    min: 0
  },

  openingHour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
    default: 9
  },
  openingMinute: {
    type: Number,
    required: true,
    enum: [0, 15, 30, 45],
    default: 0
  },
  closingHour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
    default: 21
  },
  closingMinute: {
    type: Number,
    required: true,
    enum: [0, 15, 30, 45],
    default: 0
  },

  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Supermarket', supermarketSchema);