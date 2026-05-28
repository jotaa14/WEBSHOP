const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Supermarket = require('../models/Supermarket');

const showProfile = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.send('Utilizador não encontrado.');
    }

    let orders = [];
    let supermarket = null;

    if (user.role === 'customer') {
      orders = await Order.find({ customer: user._id })
        .populate({ path: 'supermarket', populate: { path: 'user' } })
        .sort({ createdAt: -1 })
        .limit(20);
    }

    if (user.role === 'courier') {
      orders = await Order.find({ courier: user._id })
        .populate({ path: 'supermarket', populate: { path: 'user' } })
        .populate('customer')
        .sort({ createdAt: -1 })
        .limit(20);
    }

    if (user.role === 'supermarket') {
      supermarket = await Supermarket.findOne({ user: user._id });
      orders = await Order.find({ supermarket: supermarket ? supermarket._id : null })
        .populate('customer')
        .sort({ createdAt: -1 })
        .limit(20);
    }

    return res.render('profile/index', { user, orders, supermarket });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao abrir perfil.');
  }
};

const changePassword = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.send('Preenche todos os campos.');
    }

    if (newPassword.length < 8) {
      return res.send('A nova password deve ter pelo menos 8 caracteres.');
    }

    if (newPassword !== confirmNewPassword) {
      return res.send('A confirmação da nova password não coincide.');
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.send('Utilizador não encontrado.');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.send('A password atual está incorreta.');
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      return res.send('A nova password tem de ser diferente da atual.');
    }

    user.password = newPassword;
    await user.save();

    return res.render('profile/password-changed');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao alterar password.');
  }
};

const updateProfile = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const { address, city, district } = req.body;

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.send('Utilizador não encontrado.');
    }

    user.address = address || user.address;
    user.city = city || user.city;
    user.district = district || user.district;

    await user.save();

    // Update session
    req.session.user.address = user.address;
    req.session.user.city = user.city;
    req.session.user.district = user.district;

    return res.redirect('/profile');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao atualizar perfil.');
  }
};

module.exports = {
  showProfile,
  changePassword,
  updateProfile
};