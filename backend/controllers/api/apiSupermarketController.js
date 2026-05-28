const Supermarket = require('../../models/Supermarket');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const Review = require('../../models/Review');
const User = require('../../models/User');

const isOpenNow = (supermarket) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openingMinutes = (supermarket.openingHour || 0) * 60 + (supermarket.openingMinute || 0);
  const closingMinutes = (supermarket.closingHour || 23) * 60 + (supermarket.closingMinute || 0);
  return currentMinutes >= openingMinutes && currentMinutes <= closingMinutes;
};

const listSupermarkets = async (req, res) => {
  try {
    let userDistrict = req.user ? req.user.district : null;

    if (!userDistrict && req.user) {
      const user = await User.findById(req.user.id);
      userDistrict = user ? user.district : '';
    }

    const query = {};
    if (userDistrict) {
      query.district = userDistrict;
    }

    if (req.query.name && req.query.name.trim()) {
      query.name = new RegExp(req.query.name.trim(), 'i');
    }

    if (req.query.district && req.query.district.trim()) {
      query.district = req.query.district.trim();
    }

    let supermarkets = await Supermarket.find(query).lean();

    for (const supermarket of supermarkets) {
      supermarket.totalOrders = await Order.countDocuments({ supermarket: supermarket._id });
      supermarket.openNow = isOpenNow(supermarket);
    }

    if (req.query.openNow === 'true') {
      supermarkets = supermarkets.filter((s) => s.openNow);
    }

    const sortBy = req.query.sort || 'relevance';
    supermarkets.sort((a, b) => {
      if (sortBy === 'az') return a.name.localeCompare(b.name);
      if (sortBy === 'za') return b.name.localeCompare(a.name);
      if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0) || (b.totalRatings || 0) - (a.totalRatings || 0);
      return (b.totalOrders || 0) - (a.totalOrders || 0);
    });

    return res.json({ supermarkets });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar supermercados.' });
  }
};

const getSupermarket = async (req, res) => {
  try {
    const supermarket = await Supermarket.findById(req.params.id).lean();
    if (!supermarket) {
      return res.status(404).json({ error: 'Supermercado não encontrado.' });
    }

    supermarket.openNow = isOpenNow(supermarket);
    supermarket.totalOrders = await Order.countDocuments({ supermarket: supermarket._id });

    return res.json({ supermarket });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao obter supermercado.' });
  }
};

const getSupermarketProducts = async (req, res) => {
  try {
    const supermarket = await Supermarket.findById(req.params.id);
    if (!supermarket) {
      return res.status(404).json({ error: 'Supermercado não encontrado.' });
    }

    const filter = { supermarket: supermarket._id };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.name) {
      filter.name = new RegExp(req.query.name.trim(), 'i');
    }

    let sort = { name: 1 };
    if (req.query.sort === 'priceAsc') sort = { price: 1 };
    if (req.query.sort === 'priceDesc') sort = { price: -1 };
    if (req.query.sort === 'az') sort = { name: 1 };
    if (req.query.sort === 'za') sort = { name: -1 };

    const products = await Product.find(filter).sort(sort).lean();
    const categories = await Product.distinct('category', { supermarket: supermarket._id });

    return res.json({ products, categories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar produtos do supermercado.' });
  }
};

const getSupermarketReviews = async (req, res) => {
  try {
    const supermarket = await Supermarket.findById(req.params.id);
    if (!supermarket) {
      return res.status(404).json({ error: 'Supermercado não encontrado.' });
    }

    const reviews = await Review.find({ supermarket: supermarket._id })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ reviews, supermarket: { name: supermarket.name, averageRating: supermarket.averageRating, totalRatings: supermarket.totalRatings } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar avaliações.' });
  }
};

module.exports = { listSupermarkets, getSupermarket, getSupermarketProducts, getSupermarketReviews };
