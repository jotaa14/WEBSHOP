const Product = require('../../models/Product');
const Supermarket = require('../../models/Supermarket');
const Category = require('../../models/Category');
const User = require('../../models/User');

const listProducts = async (req, res) => {
  try {
    const filter = {};

    // Get user district for filtering
    let userDistrict = req.user ? req.user.district : null;
    if (!userDistrict && req.user) {
      const user = await User.findById(req.user.id);
      userDistrict = user ? user.district : '';
    }

    if (userDistrict) {
      const supermarketsInDistrict = await Supermarket.find({ district: userDistrict }).select('_id');
      const supermarketIds = supermarketsInDistrict.map((s) => s._id);

      if (req.query.supermarket && req.query.supermarket.trim()) {
        if (!supermarketIds.map(id => id.toString()).includes(req.query.supermarket.trim())) {
          return res.json({ products: [], categories: [], supermarkets: [] });
        }
        filter.supermarket = req.query.supermarket.trim();
      } else {
        filter.supermarket = { $in: supermarketIds };
      }
    }

    if (req.query.name && req.query.name.trim()) {
      filter.name = new RegExp(req.query.name.trim(), 'i');
    }

    if (req.query.category && req.query.category.trim()) {
      filter.category = req.query.category.trim();
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    let sort = { createdAt: -1 };
    if (req.query.sort === 'az') sort = { name: 1 };
    if (req.query.sort === 'za') sort = { name: -1 };
    if (req.query.sort === 'priceAsc') sort = { price: 1 };
    if (req.query.sort === 'priceDesc') sort = { price: -1 };

    const products = await Product.find(filter)
      .populate('supermarket')
      .sort(sort)
      .lean();

    const supermarketFilter = userDistrict ? { district: userDistrict } : {};
    const supermarkets = await Supermarket.find(supermarketFilter).sort({ name: 1 }).lean();
    const supermarketIds = supermarkets.map(s => s._id);
    const categories = await Product.distinct('category', { supermarket: { $in: supermarketIds } });

    return res.json({ products, categories, supermarkets });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supermarket').lean();
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    return res.json({ product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao obter produto.' });
  }
};

const compareProducts = async (req, res) => {
  try {
    const productName = req.params.name || req.query.name || '';
    if (!productName.trim()) {
      return res.status(400).json({ error: 'Nome do produto não especificado.' });
    }

    const products = await Product.find({
      name: new RegExp('^' + productName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
      stock: { $gt: 0 }
    }).populate('supermarket').sort({ price: 1 }).lean();

    return res.json({ productName: productName.trim(), products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao comparar produtos.' });
  }
};

const listCategories = async (req, res) => {
  try {
    // Get categories from Category model first
    let categories = await Category.find().sort({ name: 1 }).lean();
    const categoryNames = categories.map(c => c.name);

    // Also get categories from products
    const productCategories = await Product.distinct('category');
    for (const cat of productCategories) {
      if (!categoryNames.includes(cat)) {
        categoryNames.push(cat);
      }
    }

    categoryNames.sort();

    return res.json({ categories: categoryNames });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
};

module.exports = { listProducts, getProduct, compareProducts, listCategories };
