const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const Supermarket = require('../../models/Supermarket');

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ customer: req.user.id })
      .populate({ path: 'items.product', populate: { path: 'supermarket' } })
      .populate('items.supermarket');

    if (!cart) {
      return res.json({ cart: { items: [] }, groupedItems: {}, total: 0, cartCount: 0 });
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

        groupedItems[smId] = {
          supermarket: sm,
          items: [],
          subtotal: 0
        };
      }

      const lineTotal = item.product.price * item.quantity;
      groupedItems[smId].items.push({
        product: item.product,
        quantity: item.quantity,
        lineTotal
      });
      groupedItems[smId].subtotal += lineTotal;
    }

    const total = cart.items.reduce((sum, item) => sum + (item.product ? item.product.price * item.quantity : 0), 0);
    const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return res.json({ groupedItems, total, cartCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao obter carrinho.' });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const parsedQty = Number(quantity);
    if (isNaN(parsedQty)) {
      return res.status(400).json({ error: 'Quantidade inválida.' });
    }
    const numericQuantity = Math.max(1, parsedQty);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ error: 'Este produto não tem stock disponível.' });
    }

    let cart = await Cart.findOne({ customer: req.user.id });
    if (!cart) {
      cart = await Cart.create({ customer: req.user.id, items: [] });
    }

    const existingItem = cart.items.find((item) => String(item.product) === String(product._id));
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (currentQty + numericQuantity > product.stock) {
      return res.status(400).json({ error: `Stock insuficiente. Disponível: ${product.stock}, no carrinho: ${currentQty}.` });
    }

    if (existingItem) {
      existingItem.quantity += numericQuantity;
    } else {
      cart.items.push({ product: product._id, supermarket: product.supermarket, quantity: numericQuantity });
    }

    await cart.save();

    const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    return res.json({ message: 'Produto adicionado ao carrinho.', cartCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao adicionar ao carrinho.' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ customer: req.user.id });
    if (!cart) {
      return res.status(404).json({ error: 'Carrinho não encontrado.' });
    }

    const item = cart.items.find((entry) => String(entry.product) === String(productId));
    if (!item) {
      return res.status(404).json({ error: 'Produto não encontrado no carrinho.' });
    }

    const product = await Product.findById(productId);
    const parsedQty = Number(quantity);
    if (isNaN(parsedQty)) {
      return res.status(400).json({ error: 'Quantidade inválida.' });
    }
    const newQty = Math.max(1, parsedQty);

    if (product && newQty > product.stock) {
      return res.status(400).json({ error: `Stock insuficiente. Disponível: ${product.stock}.` });
    }

    item.quantity = newQty;
    await cart.save();

    const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    return res.json({ message: 'Carrinho atualizado.', cartCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar carrinho.' });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ customer: req.user.id });
    if (!cart) {
      return res.status(404).json({ error: 'Carrinho não encontrado.' });
    }

    cart.items = cart.items.filter((item) => String(item.product) !== String(productId));
    await cart.save();

    const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    return res.json({ message: 'Produto removido do carrinho.', cartCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao remover item do carrinho.' });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.json({ message: 'Carrinho limpo.', cartCount: 0 });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao limpar carrinho.' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
