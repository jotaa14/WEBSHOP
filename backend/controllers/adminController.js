const User = require('../models/User');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Activity = require('../models/Activity');

exports.listPendingSupermarkets = async (req, res) => {
  try {
    const pendingSupermarkets = await User.find({
      role: 'supermarket',
      approved: false
    });

    res.render('admin/pending-supermarkets', { pendingSupermarkets });
  } catch (error) {
    console.error(error);
    res.send('Erro ao listar supermercados pendentes.');
  }
};

exports.listPendingCouriers = async (req, res) => {
  try {
    const pendingCouriers = await User.find({
      role: 'courier',
      approved: false
    });

    res.render('admin/pending-couriers', { pendingCouriers });
  } catch (error) {
    console.error(error);
    res.send('Erro ao listar estafetas pendentes.');
  }
};

exports.approveSupermarket = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findOneAndUpdate(
      { _id: id, role: 'supermarket' },
      { approved: true }
    );

    res.redirect('/admin/validate-supermarkets');
  } catch (error) {
    console.error(error);
    res.send('Erro ao aprovar supermercado.');
  }
};

exports.approveCourier = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findOneAndUpdate(
      { _id: id, role: 'courier' },
      { approved: true }
    );

    res.redirect('/admin/validate-couriers');
  } catch (error) {
    console.error(error);
    res.send('Erro ao aprovar estafeta.');
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ role: 1, name: 1 });
    res.render('admin/users', { users, currentUser: req.session.user });
  } catch (error) {
    console.error(error);
    res.send('Erro ao listar utilizadores.');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.session.user.id === id) {
      return res.send('Não podes apagar o teu próprio perfil.');
    }

    const userToDelete = await User.findById(id);
    if (userToDelete) {
      if (userToDelete.role === 'supermarket') {
        const Supermarket = require('../models/Supermarket');
        const Product = require('../models/Product');
        const sm = await Supermarket.findOne({ user: id });
        if (sm) {
          await Product.deleteMany({ supermarket: sm._id });
          await Supermarket.findByIdAndDelete(sm._id);
        }
      } else if (userToDelete.role === 'customer') {
        const Cart = require('../models/Cart');
        await Cart.findOneAndDelete({ customer: id });
      }
      await User.findByIdAndDelete(id);
    }

    res.redirect('/admin/users');
  } catch (error) {
    console.error(error);
    res.send('Erro ao apagar utilizador.');
  }
};

exports.listCourierReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('customer')
      .populate('courier')
      .populate('supermarket')
      .populate('order')
      .sort({ createdAt: -1 });

    res.render('admin/courier-reviews', { reviews });
  } catch (error) {
    console.error(error);
    res.send('Erro ao listar avaliações para moderação.');
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.send('Avaliação não encontrada.');

    // We also need to clear the courierReview in Order if it's there
    if (review.order) {
      await Order.findByIdAndUpdate(review.order, { 
        $unset: { courierReview: "" } 
      });
    }

    await Review.findByIdAndDelete(id);
    res.redirect('/admin/courier-reviews');
  } catch (error) {
    console.error(error);
    res.send('Erro ao apagar avaliação.');
  }
};

exports.listAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer')
      .populate('supermarket')
      .populate('courier')
      .sort({ createdAt: -1 });
    
    res.render('admin/orders', { orders });
  } catch (error) {
    console.error(error);
    res.send('Erro ao monitorizar encomendas.');
  }
};

exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.render('admin/categories', { categories });
  } catch (error) {
    console.error(error);
    res.send('Erro ao listar categorias.');
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (name && name.trim()) {
      await Category.create({ name: name.trim() });
    }
    res.redirect('/admin/categories');
  } catch (error) {
    if (error.code === 11000) {
      return res.send('Esta categoria já existe.');
    }
    console.error(error);
    res.send('Erro ao criar categoria.');
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect('/admin/categories');
  } catch (error) {
    console.error(error);
    res.send('Erro ao apagar categoria.');
  }
};

exports.listActivities = async (req, res) => {
  try {
    const { email, action } = req.query;
    const filter = {};

    if (email && email.trim()) {
      filter.userEmail = { $regex: email.trim(), $options: 'i' };
    }

    if (action && action.trim()) {
      filter.action = action;
    }

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(200); // Limit for performance

    const actions = await Activity.distinct('action');

    res.render('admin/activities', { activities, actions, filters: req.query });
  } catch (error) {
    console.error(error);
    res.send('Erro ao listar atividades.');
  }
};