const Order = require('../models/Order');
const User = require('../models/User');
const { logActivity } = require('../utils/logger');

const listAvailableOrders = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'courier') {
      return res.redirect('/login');
    }

    const courier = await User.findById(req.session.user.id);

    if (!courier) {
      return res.send('Estafeta não encontrado.');
    }

    if (!courier.approved) {
      return res.send('A tua conta de estafeta ainda não foi aprovada pelo administrador.');
    }

    const orders = await Order.find({
      courier: null,
      deliveryDistrict: courier.district,
      status: 'preparing'
    })
      .populate('customer')
      .populate({
        path: 'supermarket',
        populate: { path: 'user' }
      })
      .sort({ createdAt: -1 });

    return res.render('courier/available-orders', {
      courier,
      orders
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao listar entregas disponíveis.');
  }
};

const acceptDelivery = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'courier') {
      return res.redirect('/login');
    }

    const courier = await User.findById(req.session.user.id);

    if (!courier) {
      return res.send('Estafeta não encontrado.');
    }

    if (!courier.approved) {
      return res.send('A tua conta de estafeta ainda não foi aprovada pelo administrador.');
    }

    // Business rule: courier can only have one active delivery at a time
    const activeDelivery = await Order.findOne({
      courier: courier._id,
      status: { $in: ['preparing', 'delivering'] }
    });

    if (activeDelivery) {
      return res.send('Já tens uma entrega ativa. Conclui a entrega atual antes de aceitar outra.');
    }

    const order = await Order.findOne({
      _id: req.params.id,
      courier: null,
      deliveryDistrict: courier.district,
      status: 'preparing'
    });

    if (!order) {
      return res.send('Entrega já não está disponível.');
    }

    order.courier = courier._id;
    await order.save();
    await logActivity(req, 'DELIVERY_ACCEPT', `Aceitou a entrega da encomenda #${order._id}`, { orderId: order._id });

    return res.redirect('/courier/my-deliveries');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao aceitar entrega.');
  }
};

const listMyDeliveries = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'courier') {
      return res.redirect('/login');
    }

    const courier = await User.findById(req.session.user.id);

    if (!courier) {
      return res.send('Estafeta não encontrado.');
    }

    const orders = await Order.find({ courier: courier._id })
      .populate('customer')
      .populate({
        path: 'supermarket',
        populate: { path: 'user' }
      })
      .sort({ createdAt: -1 });

    return res.render('courier/my-deliveries', {
      courier,
      orders
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao listar entregas do estafeta.');
  }
};

const markAsDelivered = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'courier') {
      return res.redirect('/login');
    }

    const courier = await User.findById(req.session.user.id);

    if (!courier) {
      return res.send('Estafeta não encontrado.');
    }

    const order = await Order.findOne({
      _id: req.params.id,
      courier: courier._id,
      status: 'delivering'
    });

    if (!order) {
      return res.send('Entrega não encontrada ou ainda não foi entregue pelo supermercado ao estafeta.');
    }

    order.status = 'delivered';
    await order.save();
    await logActivity(req, 'DELIVERY_COMPLETE', `Concluiu a entrega da encomenda #${order._id}`, { orderId: order._id });

    return res.redirect('/courier/my-deliveries');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao concluir entrega.');
  }
};

const listCourierReviews = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'courier') {
      return res.redirect('/login');
    }

    const courier = await User.findById(req.session.user.id);

    if (!courier) {
      return res.send('Estafeta não encontrado.');
    }

    const reviewedOrders = await Order.find({
      courier: courier._id,
      status: 'delivered',
      'courierReview.rating': { $ne: null }
    })
      .populate('customer')
      .sort({ 'courierReview.createdAt': -1, createdAt: -1 });

    return res.render('courier/reviews', {
      courier,
      reviewedOrders
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao listar avaliações do estafeta.');
  }
};

module.exports = {
  listAvailableOrders,
  acceptDelivery,
  listMyDeliveries,
  markAsDelivered,
  listCourierReviews
};