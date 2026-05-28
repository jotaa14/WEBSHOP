const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true }, // e.g., 'STOCK_CHANGE', 'PURCHASE', 'RETURN', 'DELIVERY_ACCEPTED'
  details: { type: String, required: true },
  metadata: { type: Object }, // Store extra info like orderId, productId, etc.
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
