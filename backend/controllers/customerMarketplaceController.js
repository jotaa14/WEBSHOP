const Product = require('../models/Product');
const Supermarket = require('../models/Supermarket');
const { logActivity } = require('../utils/logger');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Review = require('../models/Review');
const User = require('../models/User');
const ReturnRequest = require('../models/ReturnRequest');

const ensureCustomer = (req, res) => {
  if (!req.session.user || req.session.user.role !== 'customer') {
    res.redirect('/login');
    return false;
  }
  return true;
};

const getCartCount = async (customerId) => {
  const cart = await Cart.findOne({ customer: customerId });
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
};

const refreshSupermarketRatings = async (supermarketId) => {
  const reviews = await Review.find({ supermarket: supermarketId, supermarketRating: { $exists: true, $ne: null } });
  const totalRatings = reviews.length;
  const averageRating = totalRatings ? reviews.reduce((sum, r) => sum + Number(r.supermarketRating || 0), 0) / totalRatings : 0;
  await Supermarket.findByIdAndUpdate(supermarketId, { averageRating, totalRatings });
};

const buildProductQuery = (query) => {
  const filter = {};

  if (query.name && query.name.trim()) {
    filter.name = new RegExp(query.name.trim(), 'i');
  }

  if (query.category && query.category.trim()) {
    filter.category = query.category.trim();
  }

  if (query.supermarket && query.supermarket.trim()) {
    filter.supermarket = query.supermarket.trim();
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  return filter;
};

const buildProductSort = (sortBy) => {
  if (sortBy === 'az') return { name: 1 };
  if (sortBy === 'za') return { name: -1 };
  if (sortBy === 'priceAsc') return { price: 1 };
  if (sortBy === 'priceDesc') return { price: -1 };
  return { createdAt: -1 };
};

const isOpenNow = (supermarket) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openingMinutes = (supermarket.openingHour || 0) * 60 + (supermarket.openingMinute || 0);
  const closingMinutes = (supermarket.closingHour || 23) * 60 + (supermarket.closingMinute || 0);
  return currentMinutes >= openingMinutes && currentMinutes <= closingMinutes;
};

const listProducts = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const filter = buildProductQuery(req.query);
    let userDistrict = req.session.user.district;

    if (!userDistrict) {
      const user = await User.findById(req.session.user.id);
      userDistrict = user ? user.district : '';
      req.session.user.district = userDistrict;
    }

    // Filter by customer's district
    const supermarketsInDistrict = await Supermarket.find({ district: userDistrict }).select('_id');
    const supermarketIds = supermarketsInDistrict.map((s) => s._id);
    
    if (filter.supermarket) {
      // If a specific supermarket was requested, check if it's in the district
      if (!supermarketIds.map(id => id.toString()).includes(filter.supermarket.toString())) {
        filter.supermarket = { $in: [] }; // No results if requested supermarket is in another district
      }
    } else {
      filter.supermarket = { $in: supermarketIds };
    }

    const products = await Product.find(filter)
      .populate('supermarket')
      .sort(buildProductSort(req.query.sort));

    const categories = await Product.distinct('category', { supermarket: { $in: supermarketIds } });
    const supermarkets = await Supermarket.find({ district: userDistrict }).sort({ name: 1 });
    const districts = [userDistrict];
    const cartCount = await getCartCount(req.session.user.id);

    return res.render('customer/products', {
      products,
      categories,
      supermarkets,
      districts,
      filters: req.query,
      cartCount
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao listar produtos.');
  }
};

const listSupermarkets = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    let userDistrict = req.session.user.district;
    if (!userDistrict) {
      const user = await User.findById(req.session.user.id);
      userDistrict = user ? user.district : '';
      req.session.user.district = userDistrict;
    }
    const query = { district: userDistrict };

    if (req.query.name && req.query.name.trim()) {
      query.name = new RegExp(req.query.name.trim(), 'i');
    }

    let supermarkets = await Supermarket.find(query).lean();

    for (const supermarket of supermarkets) {
      supermarket.totalOrders = await Order.countDocuments({ supermarket: supermarket._id });
      supermarket.openNow = isOpenNow(supermarket);
    }

    if (req.query.openNow === 'true') {
      supermarkets = supermarkets.filter((supermarket) => supermarket.openNow);
    }

    const sortBy = req.query.sort || 'relevance';
    supermarkets.sort((a, b) => {
      if (sortBy === 'az') return a.name.localeCompare(b.name);
      if (sortBy === 'za') return b.name.localeCompare(a.name);
      if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0) || (b.totalRatings || 0) - (a.totalRatings || 0);
      return (b.totalOrders || 0) - (a.totalOrders || 0);
    });

    const districts = [userDistrict];
    const cartCount = await getCartCount(req.session.user.id);

    return res.render('customer/supermarkets', {
      supermarkets,
      districts,
      filters: req.query,
      cartCount
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao listar supermercados.');
  }
};

const showSupermarket = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const supermarket = await Supermarket.findById(req.params.id);
    if (!supermarket) return res.send('Supermercado não encontrado.');

    const products = await Product.find({ supermarket: supermarket._id }).sort({ name: 1 });
    const cartCount = await getCartCount(req.session.user.id);

    return res.render('customer/supermarket-details', {
      supermarket,
      products,
      cartCount,
      isOpenNowValue: isOpenNow(supermarket)
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao abrir supermercado.');
  }
};

const showCart = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    let cart = await Cart.findOne({ customer: req.session.user.id })
      .populate({ path: 'items.product', populate: { path: 'supermarket' } })
      .populate('items.supermarket');

    if (!cart) {
      cart = { items: [] };
    }

    // Group items by supermarket
    const groupedItems = {};
    for (const item of cart.items) {
      if (!item.product) continue;
      
      let smId = '';
      if (item.supermarket && item.supermarket._id) smId = String(item.supermarket._id);
      else if (item.supermarket) smId = String(item.supermarket);
      else if (item.product && item.product.supermarket && item.product.supermarket._id) smId = String(item.product.supermarket._id);
      else if (item.product && item.product.supermarket) smId = String(item.product.supermarket);

      if (!groupedItems[smId]) {
        const sm = item.product.supermarket && typeof item.product.supermarket === 'object'
          ? item.product.supermarket
          : await Supermarket.findById(smId);
        
        // Force both delivery methods to be available for the cart if they were forgotten
        if (sm && sm.deliveryMethods) {
          if (!sm.deliveryMethods.includes('courier')) sm.deliveryMethods.push('courier');
          if (!sm.deliveryMethods.includes('pickup')) sm.deliveryMethods.push('pickup');
        }

        groupedItems[smId] = {
          supermarket: sm,
          items: [],
          subtotal: 0
        };
      }
      const lineTotal = item.product.price * item.quantity;
      groupedItems[smId].items.push({ ...item.toObject ? item.toObject() : item, lineTotal });
      groupedItems[smId].subtotal += lineTotal;
    }

    const total = cart.items.reduce((sum, item) => sum + (item.product ? item.product.price * item.quantity : 0), 0);

    return res.render('customer/cart', {
      cart,
      groupedItems,
      total,
      cartCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao abrir carrinho.');
  }
};

const addToCart = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const { productId, quantity } = req.body;
    const numericQuantity = Math.max(1, Number(quantity || 1));
    const product = await Product.findById(productId);
    if (!product) return res.send('Produto não encontrado.');

    // Validate stock
    if (product.stock <= 0) {
      return res.send('Este produto não tem stock disponível.');
    }

    let cart = await Cart.findOne({ customer: req.session.user.id });
    if (!cart) {
      cart = await Cart.create({ customer: req.session.user.id, items: [] });
    }

    const existingItem = cart.items.find((item) => String(item.product) === String(product._id));
    const currentQty = existingItem ? existingItem.quantity : 0;

    // Validate total quantity against stock
    if (currentQty + numericQuantity > product.stock) {
      return res.send(`Stock insuficiente. Disponível: ${product.stock}, no carrinho: ${currentQty}.`);
    }

    if (existingItem) existingItem.quantity += numericQuantity;
    else cart.items.push({ product: product._id, supermarket: product.supermarket, quantity: numericQuantity });

    await cart.save();
    return res.redirect(req.get('Referrer') || '/customer/products');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao adicionar ao carrinho.');
  }
};

const updateCartItem = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ customer: req.session.user.id });
    if (!cart) return res.redirect('/customer/cart');

    const item = cart.items.find((entry) => String(entry.product) === String(productId));
    if (item) {
      const product = await Product.findById(productId);
      const newQty = Math.max(1, Number(quantity || 1));
      if (product && newQty > product.stock) {
        return res.send(`Stock insuficiente. Disponível: ${product.stock}.`);
      }
      item.quantity = newQty;
    }

    await cart.save();
    return res.redirect('/customer/cart');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao atualizar carrinho.');
  }
};

const removeCartItem = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const { productId } = req.body;
    const cart = await Cart.findOne({ customer: req.session.user.id });
    if (!cart) return res.redirect('/customer/cart');

    cart.items = cart.items.filter((item) => String(item.product) !== String(productId));
    await cart.save();
    return res.redirect('/customer/cart');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao remover item do carrinho.');
  }
};

const checkoutCart = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const customer = await User.findById(req.session.user.id);
    if (!customer) return res.send('Cliente não encontrado.');

    const cart = await Cart.findOne({ customer: req.session.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.send('Carrinho vazio.');

    // deliveryMethods comes from the form: { supermarketId: 'pickup' | 'courier' }
    const deliveryChoices = req.body.deliveryMethod || {};

    const itemsBySupermarket = {};
    for (const item of cart.items) {
      if (!item.product) continue;
      
      let supermarketId = '';
      if (item.supermarket && item.supermarket._id) supermarketId = String(item.supermarket._id);
      else if (item.supermarket) supermarketId = String(item.supermarket);
      else if (item.product && item.product.supermarket && item.product.supermarket._id) supermarketId = String(item.product.supermarket._id);
      else if (item.product && item.product.supermarket) supermarketId = String(item.product.supermarket);

      if (!itemsBySupermarket[supermarketId]) itemsBySupermarket[supermarketId] = [];

      // Check stock before checkout
      if (item.product.stock < item.quantity) {
        return res.send(`Stock insuficiente para o produto ${item.product.name}. Disponível: ${item.product.stock}.`);
      }

      itemsBySupermarket[supermarketId].push({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: Number((item.product.price * item.quantity).toFixed(2))
      });
    }

    for (const supermarketId of Object.keys(itemsBySupermarket)) {
      const items = itemsBySupermarket[supermarketId];
      const supermarket = await Supermarket.findById(supermarketId);

      const deliveryMethod = req.body[`deliveryMethod_${supermarketId}`] || 'pickup';
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

        await Order.create({
          customer: req.session.user.id,
          supermarket: supermarketId,
          items,
          total,
          deliveryMethod,
          deliveryCost,
          deliveryDistrict: customer.district || '',
          status: 'pending'
        });

        await logActivity(req, 'PURCHASE', `Efetuou uma encomenda no valor de ${total.toFixed(2)}€`, { orderId: supermarketId, total });
      }

    cart.items = [];
    await cart.save();

    return res.redirect('/customer/orders');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao finalizar pedido.');
  }
};

const cancelOrder = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.session.user.id
    });

    if (!order) return res.send('Encomenda não encontrada.');

    // Can only cancel pending orders, or confirmed orders within 5 minutes
    if (order.status === 'pending') {
      order.status = 'cancelled';

      // Restore stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      await order.save();
      return res.redirect('/customer/orders');
    }

    if (order.status === 'confirmed') {
      const now = new Date();
      const confirmedAt = order.updatedAt || order.createdAt;
      const diffMs = now - new Date(confirmedAt);
      const fiveMinutes = 5 * 60 * 1000;

      if (diffMs > fiveMinutes) {
        return res.send('Já passaram mais de 5 minutos desde a confirmação. Não é possível cancelar.');
      }

      order.status = 'cancelled';

      // Restore stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      await order.save();
      return res.redirect('/customer/orders');
    }

    return res.send('Esta encomenda já não pode ser cancelada.');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao cancelar encomenda.');
  }
};

const compareProducts = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const productName = req.params.productName || req.query.name || '';
    if (!productName.trim()) {
      return res.send('Nome do produto não especificado.');
    }

    const products = await Product.find({
      name: new RegExp('^' + productName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
      stock: { $gt: 0 }
    }).populate('supermarket').sort({ price: 1 });

    const cartCount = await getCartCount(req.session.user.id);

    return res.render('customer/compare', {
      productName: productName.trim(),
      products,
      cartCount
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao comparar preços.');
  }
};

const showReviewForm = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const order = await Order.findOne({ _id: req.params.id, customer: req.session.user.id })
      .populate('supermarket')
      .populate('courier');

    if (!order) return res.send('Encomenda não encontrada.');
    if (order.status !== 'delivered') return res.send('Só podes avaliar depois da encomenda estar concluída.');

    const existingReview = await Review.findOne({ order: order._id, customer: req.session.user.id });

    return res.render('customer/order-review', { order, existingReview, cartCount: await getCartCount(req.session.user.id) });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao abrir avaliação.');
  }
};

const submitReview = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const order = await Order.findOne({ _id: req.params.id, customer: req.session.user.id })
      .populate('supermarket')
      .populate('courier');

    if (!order) return res.send('Encomenda não encontrada.');
    if (order.status !== 'delivered') return res.send('Só podes avaliar depois da encomenda estar concluída.');

    const review = await Review.findOneAndUpdate(
      { order: order._id, customer: req.session.user.id },
      {
        order: order._id,
        customer: req.session.user.id,
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

    // Sync with Order for courier review compatibility
    if (order.courier && review.courierRating !== undefined) {
      order.courierReview = {
        rating: review.courierRating,
        comment: review.courierComment || '',
        createdAt: new Date()
      };
      await order.save();
    }

    return res.redirect('/customer/orders');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao guardar avaliação.');
  }
};

const listMyOrders = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const orders = await Order.find({ customer: req.session.user.id })
      .populate({
        path: 'supermarket',
        populate: { path: 'user' }
      })
      .populate('courier')
      .sort({ createdAt: -1 })
      .lean();

    const cartCount = await getCartCount(req.session.user.id);

    const returns = await ReturnRequest.find({ customer: req.session.user.id, status: { $in: ['pending', 'approved'] } });
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

    return res.render('customer/orders', { orders, cartCount });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao listar encomendas.');
  }
};

const requestReturn = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const { orderId, productId, quantity, condition } = req.body;
    
    const order = await Order.findOne({ _id: orderId, customer: req.session.user.id });
    if (!order) return res.send('Encomenda não encontrada.');
    if (order.status !== 'delivered') return res.send('Só podes devolver artigos de encomendas entregues.');

    const item = order.items.find(i => String(i.product) === String(productId));
    if (!item) return res.send('Artigo não encontrado na encomenda.');

    const returnQty = Math.max(1, Number(quantity || 1));

    const existingReturns = await ReturnRequest.find({ order: order._id, product: productId, status: { $in: ['pending', 'approved'] } });
    const returnedSoFar = existingReturns.reduce((sum, r) => sum + r.quantity, 0);

    if (returnedSoFar + returnQty > item.quantity) {
      return res.send(`Quantidade a devolver excede a permitida. Compraste ${item.quantity}, já devolveste/pediste devolução de ${returnedSoFar}.`);
    }

    await ReturnRequest.create({
      order: order._id,
      customer: req.session.user.id,
      supermarket: order.supermarket,
      product: productId,
      quantity: returnQty,
      condition: condition === 'damaged' ? 'damaged' : 'good',
      status: 'pending',
      requestedBy: 'customer'
    });

    return res.redirect('/customer/orders');
  } catch (error) {
    console.error(error);
    return res.send('Erro ao pedir devolução/reclamação.');
  }
};

const listSupermarketReviews = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const supermarket = await Supermarket.findById(req.params.id);
    if (!supermarket) return res.send('Supermercado não encontrado.');

    const reviews = await Review.find({ supermarket: supermarket._id })
      .populate('customer')
      .sort({ createdAt: -1 });

    const cartCount = await getCartCount(req.session.user.id);

    return res.render('customer/supermarket-reviews', {
      supermarket,
      reviews,
      cartCount
    });
  } catch (error) {
    console.error(error);
    return res.send('Erro ao listar avaliações do supermercado.');
  }
};

module.exports = {
  listProducts,
  listSupermarkets,
  showSupermarket,
  listSupermarketReviews,
  showCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  checkoutCart,
  cancelOrder,
  compareProducts,
  showReviewForm,
  submitReview,
  listMyOrders,
  requestReturn
};