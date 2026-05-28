const Supermarket = require('../models/Supermarket');
const Order = require('../models/Order');
const User = require('../models/User');
const ReturnRequest = require('../models/ReturnRequest');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { logActivity } = require('../utils/logger');

const ITEMS_PER_PAGE = 25;

const normalizeSearch = (value = '') => value.trim();

const buildOrderSearchFilter = (search) => {
  const value = normalizeSearch(search);
  if (!value) return {};

  const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const orConditions = [
    { customerName: regex },
    { customerEmail: regex },
    { customerNif: regex },
    { deliveryAddress: regex }
  ];

  if (value.match(/^[0-9a-fA-F]{24}$/)) {
    orConditions.push({ _id: value });
  }

  return { $or: orConditions };
};

const enrichOrderSearchFields = (order) => {
  order.customerName = order.customer && order.customer.name ? order.customer.name : '';
  order.customerEmail = order.customer && order.customer.email ? order.customer.email : '';
  order.customerNif = order.customer && order.customer.nif ? order.customer.nif : '';
  return order;
};

const getSupermarketFromSession = async (req) => {
  if (!req.session.user || req.session.user.role !== 'supermarket') {
    return null;
  }

  return Supermarket.findOne({ user: req.session.user.id });
};

const DISTRICTS = [
  'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra',
  'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre',
  'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu'
];

const showHomePage = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);

    if (!supermarket) {
      return res.redirect('/supermarket/create');
    }

    return res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao abrir a página do supermercado.');
  }
};

const showCreateForm = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);

    if (supermarket) {
      return res.redirect('/supermarket/edit');
    }

    return res.render('supermarket/create', { districts: DISTRICTS });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao abrir o formulário de criação.');
  }
};

const createSupermarket = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'supermarket') {
      return res.redirect('/login');
    }

    const {
      name,
      description,
      location,
      city,
      district,
      openingHour,
      openingMinute,
      closingHour,
      closingMinute,
      deliveryMethods,
      pickupCost,
      courierCost
    } = req.body;

    if (!name || !location || !city || !district) {
      return res.send('Preenche os campos obrigatórios do supermercado.');
    }

    const existingSupermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (existingSupermarket) {
      return res.send('Este utilizador já tem um supermercado criado.');
    }

    const deliveryMethodsArray = Array.isArray(deliveryMethods)
      ? deliveryMethods
      : deliveryMethods ? [deliveryMethods] : ['pickup'];

    await Supermarket.create({
      user: req.session.user.id,
      name: name.trim(),
      description: description ? description.trim() : '',
      location: location.trim(),
      city: city.trim(),
      district: district.trim(),
      openingHour: Number(openingHour || 9),
      openingMinute: Number(openingMinute || 0),
      closingHour: Number(closingHour || 21),
      closingMinute: Number(closingMinute || 0),
      deliveryMethods: deliveryMethodsArray,
      pickupCost: Number(pickupCost || 0),
      courierCost: Number(courierCost || 0)
    });

    await User.findByIdAndUpdate(req.session.user.id, { district: district.trim() });

    return res.redirect('/supermarket/edit');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao criar supermercado.');
  }
};

const showEditForm = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);

    if (!supermarket) {
      return res.redirect('/supermarket/create');
    }

    return res.render('supermarket/edit', { supermarket, districts: DISTRICTS });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao abrir o formulário de edição.');
  }
};

const updateSupermarket = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    const {
      name,
      description,
      location,
      city,
      district,
      openingHour,
      openingMinute,
      closingHour,
      closingMinute,
      deliveryMethods,
      pickupCost,
      courierCost
    } = req.body;

    if (!name || !location || !city || !district) {
      return res.send('Preenche os campos obrigatórios do supermercado.');
    }

    const deliveryMethodsArray = Array.isArray(deliveryMethods)
      ? deliveryMethods
      : deliveryMethods ? [deliveryMethods] : ['pickup'];

    supermarket.name = name.trim();
    supermarket.description = description ? description.trim() : '';
    supermarket.location = location.trim();
    supermarket.city = city.trim();
    supermarket.district = district.trim();
    supermarket.openingHour = Number(openingHour || 9);
    supermarket.openingMinute = Number(openingMinute || 0);
    supermarket.closingHour = Number(closingHour || 21);
    supermarket.closingMinute = Number(closingMinute || 0);
    supermarket.deliveryMethods = deliveryMethodsArray;
    supermarket.pickupCost = Number(pickupCost || 0);
    supermarket.courierCost = Number(courierCost || 0);

    await supermarket.save();
    await User.findByIdAndUpdate(req.session.user.id, { district: district.trim() });

    return res.redirect('/supermarket/edit');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao atualizar supermercado.');
  }
};

const renderManageOrders = async (req, res, activeTab = 'pending') => {
  try {
    const supermarket = await getSupermarketFromSession(req);

    if (!supermarket) {
      return res.redirect('/supermarket/create');
    }

    const search = normalizeSearch(req.query.search || '');
    const mode = req.query.mode === 'expand' ? 'expand' : 'hide';
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);

    const tabStatuses = {
      pending: ['pending'],
      confirmed: ['confirmed', 'preparing'],
      delivering: ['delivering', 'ready_for_pickup'],
      cancelled: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'delivering', 'delivered', 'cancelled'],
      history: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'delivering', 'delivered', 'cancelled']
    };

    const baseOrders = await Order.find({
      supermarket: supermarket._id,
      status: { $in: tabStatuses[activeTab] || ['pending'] }
    })
      .populate('customer')
      .populate('courier')
      .sort({ createdAt: -1 });

    const enriched = baseOrders.map((order) => enrichOrderSearchFields(order));
    const searchFilter = buildOrderSearchFilter(search);

    const filteredOrders = !searchFilter.$or
      ? enriched
      : enriched.filter((order) => {
          return searchFilter.$or.some((condition) => {
            if (condition._id) {
              return String(order._id) === String(condition._id);
            }
            if (condition.customerName) return condition.customerName.test(order.customerName || '');
            if (condition.customerEmail) return condition.customerEmail.test(order.customerEmail || '');
            if (condition.customerNif) return condition.customerNif.test(order.customerNif || '');
            if (condition.deliveryAddress) return condition.deliveryAddress.test(order.deliveryAddress || '');
            return false;
          });
        });

    const totalOrders = filteredOrders.length;
    const totalPages = Math.max(Math.ceil(totalOrders / ITEMS_PER_PAGE), 1);
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const orders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return res.render('supermarket/manage-orders', {
      supermarket,
      orders,
      activeTab,
      search,
      mode,
      currentPage: safePage,
      totalPages,
      totalOrders,
      itemsPerPage: ITEMS_PER_PAGE
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao carregar gestão de encomendas.');
  }
};

const listPendingOrders = async (req, res) => renderManageOrders(req, res, 'pending');
const listConfirmedOrders = async (req, res) => renderManageOrders(req, res, 'confirmed');
const listDeliveringOrders = async (req, res) => renderManageOrders(req, res, 'delivering');
const manageCancelledOrders = async (req, res) => renderManageOrders(req, res, 'cancelled');
const listOrderHistory = async (req, res) => renderManageOrders(req, res, 'history');

const acceptOrder = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);
    if (!supermarket) return res.redirect('/supermarket/create');

    const order = await Order.findOne({ _id: req.params.id, supermarket: supermarket._id, status: 'pending' });
    if (!order) return res.send('Encomenda pendente não encontrada.');

    order.status = 'confirmed';
    await order.save();
    await logActivity(req, 'ORDER_ACCEPT', `Aceitou a encomenda #${order._id}`, { orderId: order._id });
    return res.redirect('/supermarket/orders/manage/confirmed');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao aceitar encomenda.');
  }
};

const markAsPreparing = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);
    if (!supermarket) return res.redirect('/supermarket/create');

    const order = await Order.findOne({ _id: req.params.id, supermarket: supermarket._id, status: 'confirmed' });
    if (!order) return res.send('Encomenda confirmada não encontrada.');

    order.status = 'preparing';
    await order.save();
    return res.redirect('/supermarket/orders/manage/confirmed');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao colocar encomenda em preparação.');
  }
};

const handToCourier = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);
    if (!supermarket) return res.redirect('/supermarket/create');

    const order = await Order.findOne({ _id: req.params.id, supermarket: supermarket._id, status: 'preparing' }).populate('courier');
    if (!order) return res.send('Encomenda em preparação não encontrada.');
    if (!order.courier) return res.send('Ainda nenhum estafeta aceitou esta encomenda.');

    order.status = 'delivering';
    await order.save();
    return res.redirect('/supermarket/orders/manage/delivering');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao entregar encomenda ao estafeta.');
  }
};

const cancelOrder = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);
    if (!supermarket) return res.redirect('/supermarket/create');

    const order = await Order.findOne({
      _id: req.params.id,
      supermarket: supermarket._id,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'delivering'] }
    });

    if (!order) return res.send('Encomenda não encontrada ou já não pode ser cancelada.');

    order.status = 'cancelled';
    await order.save();
    await logActivity(req, 'ORDER_CANCEL', `Cancelou a encomenda #${order._id}`, { orderId: order._id });
    return res.redirect('/supermarket/orders/manage/cancel');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao cancelar encomenda.');
  }
};

const markAsDeliveredPickup = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);
    if (!supermarket) return res.redirect('/supermarket/create');

    const order = await Order.findOne({ 
      _id: req.params.id, 
      supermarket: supermarket._id, 
      status: 'ready_for_pickup',
      deliveryMethod: 'pickup'
    });

    if (!order) return res.send('Encomenda não encontrada ou não é de levantamento.');

    order.status = 'delivered';
    await order.save();
    return res.redirect('/supermarket/orders/history');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao marcar como entregue.');
  }
};

const markAsReadyForPickup = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);
    if (!supermarket) return res.redirect('/supermarket/create');

    const order = await Order.findOne({ 
      _id: req.params.id, 
      supermarket: supermarket._id, 
      status: 'preparing',
      deliveryMethod: 'pickup'
    });

    if (!order) return res.send('Encomenda não encontrada ou não é de levantamento em loja.');

    order.status = 'ready_for_pickup';
    await order.save();
    return res.redirect('/supermarket/orders/manage/delivering');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao marcar como disponível para levantamento.');
  }
};

const listReturns = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);
    if (!supermarket) return res.redirect('/supermarket/create');

    const returns = await ReturnRequest.find({ supermarket: supermarket._id })
      .populate('order')
      .populate('customer')
      .populate('product')
      .sort({ createdAt: -1 });

    const activeTab = req.query.tab || 'pending';
    const products = await Product.find({ supermarket: supermarket._id }).sort({ name: 1 });

    return res.render('supermarket/returns', {
      supermarket,
      returns,
      products,
      activeTab
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao listar devoluções.');
  }
};

const processReturn = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);
    if (!supermarket) return res.redirect('/supermarket/create');

    const returnReq = await ReturnRequest.findOne({ _id: req.params.id, supermarket: supermarket._id, status: 'pending' });
    if (!returnReq) return res.send('Pedido de devolução não encontrado.');

    const { action } = req.body;

    if (action === 'approve') {
      returnReq.status = 'approved';
      if (returnReq.condition === 'good') {
        const product = await Product.findById(returnReq.product);
        if (product) {
          product.stock += returnReq.quantity;
          await product.save();
        }
      }
    } else {
      returnReq.status = 'rejected';
    }

    await returnReq.save();
    await logActivity(req, 'RETURN_PROCESS', `${action === 'approve' ? 'Aprovou' : 'Rejeitou'} a devolução #${returnReq._id}`, { returnId: returnReq._id, action });
    return res.redirect('/supermarket/returns?tab=' + (action === 'approve' ? 'approved' : 'rejected'));
  } catch (error) {
    console.error(error);
    return res.send('Erro ao processar devolução.');
  }
};

const createDirectReturn = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);
    if (!supermarket) return res.redirect('/supermarket/create');

    const { orderId, productId, quantity, condition } = req.body;

    const order = await Order.findOne({ _id: orderId, supermarket: supermarket._id });
    if (!order) return res.send('Encomenda não encontrada ou não pertence a este supermercado.');

    const item = order.items.find(i => String(i.product) === String(productId));
    if (!item) return res.send('Artigo não encontrado na encomenda.');

    const returnQty = Math.max(1, Number(quantity || 1));

    const existingReturns = await ReturnRequest.find({ order: order._id, product: productId, status: { $in: ['pending', 'approved'] } });
    const returnedSoFar = existingReturns.reduce((sum, r) => sum + r.quantity, 0);

    if (returnedSoFar + returnQty > item.quantity) {
      return res.send(`Quantidade a devolver excede a permitida. Na encomenda há ${item.quantity}, já existem devoluções de ${returnedSoFar}.`);
    }

    await ReturnRequest.create({
      order: order._id,
      customer: order.customer,
      supermarket: supermarket._id,
      product: productId,
      quantity: returnQty,
      condition: condition === 'damaged' ? 'damaged' : 'good',
      status: 'approved',
      requestedBy: 'supermarket'
    });

    if (condition !== 'damaged') {
      const product = await Product.findById(productId);
      if (product) {
        product.stock += returnQty;
        await product.save();
      }
    }

    await order.save();
    await logActivity(req, 'RETURN_DIRECT', `Criou uma devolução direta para a encomenda #${order._id}`, { orderId: order._id, productId });
    return res.redirect('/supermarket/returns?tab=approved');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao criar devolução direta.');
  }
};

const listMyReviews = async (req, res) => {
  try {
    const supermarket = await getSupermarketFromSession(req);
    if (!supermarket) return res.redirect('/supermarket/create');

    const reviews = await Review.find({ supermarket: supermarket._id })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    return res.render('supermarket/reviews', {
      supermarket,
      reviews
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao listar avaliações.');
  }
};

module.exports = {
  showHomePage,
  showCreateForm,
  createSupermarket,
  showEditForm,
  updateSupermarket,
  listPendingOrders,
  listConfirmedOrders,
  listDeliveringOrders,
  manageCancelledOrders,
  listOrderHistory,
  acceptOrder,
  markAsPreparing,
  handToCourier,
  cancelOrder,
  markAsReadyForPickup,
  markAsDeliveredPickup,
  listReturns,
  processReturn,
  createDirectReturn,
  listMyReviews
};