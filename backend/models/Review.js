const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supermarket: { type: mongoose.Schema.Types.ObjectId, ref: 'Supermarket' },
  courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supermarketRating: { type: Number, min: 1, max: 5 },
  courierRating: { type: Number, min: 1, max: 5 },
  supermarketComment: { type: String, trim: true },
  courierComment: { type: String, trim: true }
}, { timestamps: true });

reviewSchema.index({ order: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);