const Order = require('../../models/Order');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const Supermarket = require('../../models/Supermarket');
const User = require('../../models/User');
const Review = require('../../models/Review');
const ReturnRequest = require('../../models/ReturnRequest');
const Activity = require('../../models/Activity');

const logApiActivity = async (userId, userName, userEmail, action, details, metadata = {}) => {
  try {
    await Activity.create({ user: userId, userName, userEmail, action, details, metadata });
  } catch (err) {
    console.error('Erro ao registar atividade API:', err);
  }
};

const refreshSupermarketRatings = async (supermarketId) => {
  const reviews = await Review.find({ supermarket: supermarketId, supermarketRating: { $exists: true, $ne: null } });
  const totalRatings = reviews.length;
  const averageRating = totalRatings ? reviews.reduce((sum, r) => sum + Number(r.supermarketRating || 0), 0) / totalRatings : 0;
  await Supermarket.findByIdAndUpdate(supermarketId, { averageRating, totalRatings });
};

const checkout = async (req, res) => {
  try {
    const customer = await User.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const cart = await Cart.findOne({ customer: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio.' });
    }

    const deliveryChoices = req.body.deliveryMethods || {};

    const itemsBySupermarket = {};
    for (const item of cart.items) {
      if (!item.product) continue;

      let supermarketId = '';
      if (item.supermarket && item.supermarket._id) supermarketId = String(item.supermarket._id);
      else if (item.supermarket) supermarketId = String(item.supermarket);
      else if (item.product && item.product.supermarket && item.product.supermarket._id) supermarketId = String(item.product.supermarket._id);
      else if (item.product && item.product.supermarket) supermarketId = String(item.product.supermarket);

      if (!itemsBySupermarket[supermarketId]) itemsBySupermarket[supermarketId] = [];

      if (item.product.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuficiente para o produto ${item.product.name}. Disponível: ${item.product.stock}.` });
      }

      itemsBySupermarket[supermarketId].push({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: Number((item.product.price * item.quantity).toFixed(2))
      });
    }

    const createdOrders = [];

    for (const supermarketId of Object.keys(itemsBySupermarket)) {
      const items = itemsBySupermarket[supermarketId];
      const supermarket = await Supermarket.findById(supermarketId);

      const deliveryMethod = deliveryChoices[supermarketId] || 'pickup';
      let deliveryCost = 0;

      if (deliveryMethod === 'courier' && supermarket) {
        deliveryCost = supermarket.courierCost || 0;
      } else if (deliveryMethod === 'pickup' && supermarket) {
        deliveryCost = supermarket.pickupCost || 0;
      }

      const itemsTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const total = Number((itemsTotal + deliveryCost).toFixed(2));

      // Deduct stock
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock -= item.quantity;
          await product.save();
        }
      }

      const order = await Order.create({
        customer: req.user.id,
        supermarket: supermarketId,
        items,
        total,
        deliveryMethod,
        deliveryCost,
        deliveryDistrict: customer.district || '',
        status: 'pending'
      });

      createdOrders.push(order);

      await logApiActivity(req.user.id, req.user.name, req.user.email,
        'PURCHASE', `Efetuou uma encomenda no valor de ${total.toFixed(2)}€`, { orderId: order._id, total });

      // PROGRESSIVE CART CLEARING:
      // Remove only the items belonging to the successfully created order's supermarket.
      // This prevents the cart from keeping items if a subsequent order fails in the loop.
      cart.items = cart.items.filter(i => {
        let sId = '';
        if (i.supermarket && i.supermarket._id) sId = String(i.supermarket._id);
        else if (i.supermarket) sId = String(i.supermarket);
        else if (i.product && i.product.supermarket && i.product.supermarket._id) sId = String(i.product.supermarket._id);
        else if (i.product && i.product.supermarket) sId = String(i.product.supermarket);
        
        return sId !== supermarketId;
      });
      await cart.save();
    }

    return res.status(201).json({ message: 'Encomenda(s) criada(s) com sucesso.', orders: createdOrders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao finalizar pedido.' });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate({
        path: 'supermarket',
        populate: { path: 'user' }
      })
      .populate('courier', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    const returns = await ReturnRequest.find({ customer: req.user.id, status: { $in: ['pending', 'approved'] } });
    const returnedMap = {};
    for (const r of returns) {
      const key = `${r.order}_${r.product}`;
      returnedMap[key] = (returnedMap[key] || 0) + r.quantity;
    }

    for (const order of orders) {
      for (const item of order.items) {
        const key = `${order._id}_${item.product}`;
        item.returnedQuantity = returnedMap[key] || 0;
      }
    }

    return res.json({ orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar encomendas.' });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user.id })
      .populate({
        path: 'supermarket',
        populate: { path: 'user' }
      })
      .populate('courier', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada.' });
    }

    // Check for existing review
    const review = await Review.findOne({ order: order._id, customer: req.user.id }).lean();
    order.review = review || null;

    // Check for return requests
    const returns = await ReturnRequest.find({ order: order._id, customer: req.user.id });
    const returnedMap = {};
    for (const r of returns) {
      const key = String(r.product);
      returnedMap[key] = (returnedMap[key] || 0) + r.quantity;
    }
    for (const item of order.items) {
      item.returnedQuantity = returnedMap[String(item.product)] || 0;
    }

    return res.json({ order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao obter encomenda.' });
  }
};

const getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user.id })
      .select('status deliveryMethod courier updatedAt')
      .populate('courier', 'name phone')
      .lean();

    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada.' });
    }

    return res.json({
      status: order.status,
      deliveryMethod: order.deliveryMethod,
      courier: order.courier,
      updatedAt: order.updatedAt
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao obter estado da encomenda.' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user.id });

    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada.' });
    }

    if (order.status === 'pending') {
      order.status = 'cancelled';

      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      await order.save();
      return res.json({ message: 'Encomenda cancelada com sucesso.' });
    }

    if (order.status === 'confirmed') {
      const now = new Date();
      const confirmedAt = order.updatedAt || order.createdAt;
      const diffMs = now - new Date(confirmedAt);
      const fiveMinutes = 5 * 60 * 1000;

      if (diffMs > fiveMinutes) {
        return res.status(400).json({ error: 'Já passaram mais de 5 minutos desde a confirmação. Não é possível cancelar.' });
      }

      order.status = 'cancelled';

      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      await order.save();
      return res.json({ message: 'Encomenda cancelada com sucesso.' });
    }

    return res.status(400).json({ error: 'Esta encomenda já não pode ser cancelada.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao cancelar encomenda.' });
  }
};

const submitReview = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user.id })
      .populate('supermarket')
      .populate('courier');

    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada.' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Só podes avaliar depois da encomenda estar concluída.' });
    }

    const review = await Review.findOneAndUpdate(
      { order: order._id, customer: req.user.id },
      {
        order: order._id,
        customer: req.user.id,
        supermarket: order.supermarket ? order.supermarket._id : null,
        courier: order.courier ? order.courier._id : null,
        supermarketRating: Number(req.body.supermarketRating || 0) || undefined,
        courierRating: Number(req.body.courierRating || 0) || undefined,
        supermarketComment: req.body.supermarketComment || '',
        courierComment: req.body.courierComment || ''
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (review.supermarket) {
      await refreshSupermarketRatings(review.supermarket);
    }

    if (order.courier && review.courierRating !== undefined) {
      order.courierReview = {
        rating: review.courierRating,
        comment: review.courierComment || '',
        createdAt: new Date()
      };
      await order.save();
    }

    return res.json({ message: 'Avaliação guardada com sucesso.', review });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao guardar avaliação.' });
  }
};

const getReview = async (req, res) => {
  try {
    const review = await Review.findOne({ order: req.params.id, customer: req.user.id }).lean();
    return res.json({ review: review || null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao obter avaliação.' });
  }
};

const requestReturn = async (req, res) => {
  try {
    const { orderId, productId, quantity, condition } = req.body;

    const order = await Order.findOne({ _id: orderId, customer: req.user.id });
    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada.' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Só podes devolver artigos de encomendas entregues.' });
    }

    const item = order.items.find(i => String(i.product) === String(productId));
    if (!item) {
      return res.status(404).json({ error: 'Artigo não encontrado na encomenda.' });
    }

    const parsedQty = Number(quantity);
    if (isNaN(parsedQty)) {
      return res.status(400).json({ error: 'Quantidade de devolução inválida.' });
    }
    const returnQty = Math.max(1, parsedQty);

    const existingReturns = await ReturnRequest.find({ order: order._id, product: productId, status: { $in: ['pending', 'approved'] } });
    const returnedSoFar = existingReturns.reduce((sum, r) => sum + r.quantity, 0);

    if (returnedSoFar + returnQty > item.quantity) {
      return res.status(400).json({ error: `Quantidade a devolver excede a permitida. Compraste ${item.quantity}, já devolveste/pediste devolução de ${returnedSoFar}.` });
    }

    const returnRequest = await ReturnRequest.create({
      order: order._id,
      customer: req.user.id,
      supermarket: order.supermarket,
      product: productId,
      quantity: returnQty,
      condition: condition === 'damaged' ? 'damaged' : 'good',
      status: 'pending',
      requestedBy: 'customer'
    });

    return res.status(201).json({ message: 'Pedido de devolução criado com sucesso.', returnRequest });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao pedir devolução.' });
  }
};

module.exports = { checkout, listOrders, getOrder, getOrderStatus, cancelOrder, submitReview, getReview, requestReturn };
