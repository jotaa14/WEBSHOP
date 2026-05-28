const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Supermarket = require('../models/Supermarket');
const Product = require('../models/Product');

const showDashboard = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.send('Utilizador não encontrado.');
    }

    if (user.role === 'admin') {
      const totalUsers = await User.countDocuments();
      const totalCustomers = await User.countDocuments({ role: 'customer' });
      const totalSupermarkets = await User.countDocuments({ role: 'supermarket', approved: true });
      const totalCouriers = await User.countDocuments({ role: 'courier', approved: true });
      const pendingSupermarkets = await User.countDocuments({ role: 'supermarket', approved: false });
      const pendingCouriers = await User.countDocuments({ role: 'courier', approved: false });
      const totalOrders = await Order.countDocuments();
      const totalSales = await Sale.countDocuments();
      const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
      const pendingOrders = await Order.countDocuments({ status: 'pending' });

      return res.render('dashboards/admin', {
        user,
        stats: {
          totalUsers,
          totalCustomers,
          totalSupermarkets,
          totalCouriers,
          pendingSupermarkets,
          pendingCouriers,
          totalOrders,
          totalSales,
          deliveredOrders,
          pendingOrders
        }
      });
    }

    if (user.role === 'courier') {
      const totalDeliveries = await Order.countDocuments({ courier: user._id });
      const deliveredCount = await Order.countDocuments({ courier: user._id, status: 'delivered' });
      const activeDelivery = await Order.findOne({ courier: user._id, status: { $in: ['preparing', 'delivering'] } });

      // Supermarkets with most deliveries
      const topSupermarkets = await Order.aggregate([
        { $match: { courier: user._id, status: 'delivered' } },
        { $group: { _id: '$supermarket', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'supermarkets', localField: '_id', foreignField: '_id', as: 'supermarket' } },
        { $unwind: { path: '$supermarket', preserveNullAndEmptyArrays: true } }
      ]);

      return res.render('dashboards/courier', {
        user,
        stats: {
          totalDeliveries,
          deliveredCount,
          hasActiveDelivery: !!activeDelivery,
          topSupermarkets
        }
      });
    }

    if (user.role === 'customer') {
      const totalOrders = await Order.countDocuments({ customer: user._id });
      const deliveredOrders = await Order.countDocuments({ customer: user._id, status: 'delivered' });
      const pendingOrders = await Order.countDocuments({ customer: user._id, status: { $in: ['pending', 'confirmed', 'preparing', 'delivering'] } });

      // Most bought products
      const topProducts = await Order.aggregate([
        { $match: { customer: user._id } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', totalQuantity: { $sum: '$items.quantity' }, totalSpent: { $sum: '$items.subtotal' } } },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ]);

      return res.render('dashboards/customer', {
        user,
        stats: {
          totalOrders,
          deliveredOrders,
          pendingOrders,
          topProducts
        }
      });
    }

    if (user.role === 'supermarket') {
      const supermarket = await Supermarket.findOne({ user: user._id });

      if (!supermarket) {
        return res.render('dashboards/supermarket', {
          user,
          supermarket: null,
          stats: null
        });
      }

      const totalOrders = await Order.countDocuments({ supermarket: supermarket._id });
      const pendingOrders = await Order.countDocuments({ supermarket: supermarket._id, status: 'pending' });
      const deliveredOrders = await Order.countDocuments({ supermarket: supermarket._id, status: 'delivered' });
      const totalSales = await Sale.countDocuments({ supermarket: supermarket._id });
      const totalProducts = await Product.countDocuments({ supermarket: supermarket._id });

      // Most sold products (from orders)
      const topProducts = await Order.aggregate([
        { $match: { supermarket: supermarket._id } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.subtotal' } } },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ]);

      return res.render('dashboards/supermarket', {
        user,
        supermarket,
        stats: {
          totalOrders,
          pendingOrders,
          deliveredOrders,
          totalSales,
          totalProducts,
          topProducts
        }
      });
    }

    return res.send('Perfil inválido.');
  } catch (error) {
    console.error(error);
    res.send('Erro ao carregar dashboard.');
  }
};

const changePassword = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.send('Preenche todos os campos da password.');
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

    res.send('Password alterada com sucesso.');
  } catch (error) {
    console.error(error);
    res.send('Erro ao alterar password.');
  }
};

module.exports = {
  showDashboard,
  changePassword
};