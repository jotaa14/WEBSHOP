const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userRole: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true }, // Initial message
  messages: [{
    sender: { type: String, enum: ['user', 'admin'] },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    enum: ['opened', 'closed', 'cancelled'], 
    default: 'opened' 
  },
  isResolved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
