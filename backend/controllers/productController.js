const Product = require('../models/Product');
const Supermarket = require('../models/Supermarket');
const Category = require('../models/Category');
const { logActivity } = require('../utils/logger');

exports.listProducts = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    const products = await Product.find({ supermarket: supermarket._id });

    res.render('products/index', { products });
  } catch (error) {
    console.error(error);
    res.send('Erro ao listar produtos.');
  }
};

exports.showCreateForm = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    const categories = await Category.find().sort({ name: 1 });

    res.render('products/create', { categories });
  } catch (error) {
    console.error(error);
    res.send('Erro ao carregar formulário de criação.');
  }
};

exports.createProduct = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    const { name, description, category, price, image, stock } = req.body;

    await Product.create({
      supermarket: supermarket._id,
      name,
      description,
      category,
      price,
      image,
      stock
    });

    await logActivity(req, 'PRODUCT_CREATE', `Criou o produto ${name} com stock ${stock}`, { productName: name, stock });

    res.redirect('/products');
  } catch (error) {
    console.error(error);
    res.send('Erro ao criar produto.');
  }
};

exports.showEditForm = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    const product = await Product.findOne({
      _id: req.params.id,
      supermarket: supermarket._id
    });

    if (!product) {
      return res.send('Produto não encontrado.');
    }

    const categories = await Category.find().sort({ name: 1 });

    res.render('products/edit', { product, categories });
  } catch (error) {
    console.error(error);
    res.send('Erro ao abrir edição do produto.');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    const { name, description, category, price, image, stock } = req.body;

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        supermarket: supermarket._id
      },
      {
        name,
        description,
        category,
        price,
        image,
        stock
      },
      { new: true }
    );

    if (!product) {
      return res.send('Produto não encontrado.');
    }

    await logActivity(req, 'PRODUCT_UPDATE', `Atualizou o produto ${name} (Novo stock: ${stock})`, { productId: product._id, productName: name, stock });

    res.redirect('/products');
  } catch (error) {
    console.error(error);
    res.send('Erro ao atualizar produto.');
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      supermarket: supermarket._id
    });

    if (!product) {
      return res.send('Produto não encontrado.');
    }

    await logActivity(req, 'PRODUCT_DELETE', `Apagou o produto ${product.name}`, { productId: product._id, productName: product.name });

    res.redirect('/products');
  } catch (error) {
    console.error(error);
    res.send('Erro ao apagar produto.');
  }
};