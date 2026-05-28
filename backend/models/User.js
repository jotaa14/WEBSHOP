const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  birthDate: {
    type: String,
    default: null
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nif: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  address: {
    type: String,
    default: 'N/I',
    trim: true
  },
  city: {
    type: String,
    default: 'N/I',
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'courier', 'customer', 'supermarket'],
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['carro', 'mota', null],
    default: null
  },
  vehicleBrand: {
    type: String,
    default: null,
    trim: true
  },
  vehiclePlate: {
    type: String,
    default: null,
    trim: true
  },
  approved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);