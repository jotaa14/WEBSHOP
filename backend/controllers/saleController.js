const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Supermarket = require('../models/Supermarket');
const User = require('../models/User');
const { logActivity } = require('../utils/logger');

const listSales = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    const search = req.query.search ? req.query.search.trim() : '';
    const filter = { supermarket: supermarket._id };

    if (search) {
      filter['items.name'] = { $regex: search, $options: 'i' };
    }

    const sales = await Sale.find(filter)
      .populate('customer')
      .populate('supermarket')
      .sort({ createdAt: -1 });

    res.render('sales/index', { sales, search });
  } catch (error) {
    console.error(error);
    res.send('Erro ao listar vendas.');
  }
};

const showCreateForm = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    const search = req.query.search ? req.query.search.trim() : '';
    const customerEmail = req.query.customerEmail ? req.query.customerEmail.trim().toLowerCase() : '';

    const productFilter = {
      supermarket: supermarket._id,
      stock: { $gt: 0 }
    };

    if (search) {
      productFilter.name = { $regex: search, $options: 'i' };
    }

    let customer = null;
    if (customerEmail) {
      customer = await User.findOne({ email: customerEmail, role: 'customer' }).select('name email phone nif address city district');
    }

    const products = await Product.find(productFilter).sort({ name: 1 });

    res.render('sales/create', { products, search, customer, customerEmail });
  } catch (error) {
    console.error(error);
    res.send('Erro ao abrir formulário de venda.');
  }
};

const createSale = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    let {
      customerId,
      isConsumidorFinal,
      productIds,
      quantities
    } = req.body;

    let customer = null;

    if (isConsumidorFinal === 'true') {
      customer = null;
    } else if (customerId) {
      customer = await User.findOne({ _id: customerId, role: 'customer' });
      if (!customer) {
        return res.send('Cliente selecionado não encontrado.');
      }
    } else {
      return res.send('Seleciona um cliente ou opta por Consumidor Final.');
    }

    const productIdsArray = Array.isArray(productIds) ? productIds : [productIds];
    const quantitiesArray = Array.isArray(quantities) ? quantities : [quantities];

    const items = [];
    let total = 0;

    for (let i = 0; i < productIdsArray.length; i++) {
      const productId = productIdsArray[i];
      const quantity = Number(quantitiesArray[i]);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        continue;
      }

      const product = await Product.findOne({
        _id: productId,
        supermarket: supermarket._id
      });

      if (!product) {
        continue;
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.send(`Preço inválido para o produto ${product.name}.`);
      }

      if (product.stock < quantity) {
        return res.send(`Stock insuficiente para o produto ${product.name}.`);
      }

      const subtotal = Number((price * quantity).toFixed(2));

      if (!Number.isFinite(subtotal) || subtotal < 0) {
        return res.send(`Subtotal inválido para o produto ${product.name}.`);
      }

      items.push({
        product: product._id,
        name: product.name,
        price,
        quantity,
        subtotal
      });

      total += subtotal;
    }

    total = Number(total.toFixed(2));

    if (items.length === 0) {
      return res.send('Seleciona pelo menos um produto com quantidade superior a 0.');
    }

    if (!Number.isFinite(total) || total < 0) {
      return res.send('Total da venda inválido.');
    }

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    const lastSale = await Sale.findOne().sort({ saleNumber: -1 });
    const nextSaleNumber = lastSale && Number.isFinite(lastSale.saleNumber)
      ? lastSale.saleNumber + 1
      : 1;

    if (!Number.isInteger(nextSaleNumber) || nextSaleNumber <= 0) {
      return res.send('Número de venda inválido.');
    }

    await Sale.create({
      saleNumber: nextSaleNumber,
      customer: customer ? customer._id : null,
      supermarket: supermarket._id,
      items,
      total,
      status: 'completed'
    });

    await logActivity(req, 'SALE_REGISTER', `Registou uma venda manual no valor de ${total.toFixed(2)}€`, { saleNumber: nextSaleNumber, total });

    res.redirect('/sales');
  } catch (error) {
    console.error('ERRO COMPLETO AO REGISTAR VENDA:');
    console.error(error);

    if (error.name === 'ValidationError') {
      const mensagens = Object.values(error.errors).map(err => err.message);
      return res.send(`Erro de validação: ${mensagens.join(' | ')}`);
    }

    if (error.code === 11000) {
      const campo = Object.keys(error.keyPattern || {})[0];
      const valor = error.keyValue ? error.keyValue[campo] : '';

      if (campo === 'saleNumber') {
        return res.send(`Número de venda duplicado (${valor}).`);
      }

      if (campo === 'email') {
        return res.send(`Já existe um utilizador com o email ${valor}.`);
      }

      if (campo === 'phone') {
        return res.send(`Já existe um utilizador com o telefone ${valor}.`);
      }

      if (campo === 'nif') {
        return res.send(`Já existe um utilizador com o NIF ${valor}.`);
      }

      return res.send(`Valor duplicado no campo ${campo}.`);
    }

    return res.send(`Erro ao registar venda: ${error.message}`);
  }
};

const cancelSale = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ user: req.session.user.id });

    if (!supermarket) {
      return res.send('Supermercado não encontrado.');
    }

    const sale = await Sale.findOne({
      _id: req.params.id,
      supermarket: supermarket._id
    });

    if (!sale) {
      return res.send('Venda não encontrada.');
    }

    if (sale.status === 'cancelled') {
      return res.send('A venda já foi anulada.');
    }

    const { cancellationReason, returnCondition } = req.body;

    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    sale.status = 'cancelled';
    sale.cancellationReason = cancellationReason || null;
    sale.returnCondition = returnCondition || null;

    await sale.save();
    await logActivity(req, 'SALE_CANCEL', `Anulou a venda #${sale.saleNumber}`, { saleId: sale._id, saleNumber: sale.saleNumber });

    res.redirect('/sales');
  } catch (error) {
    console.error(error);
    res.send('Erro ao anular venda.');
  }
};

module.exports = {
  listSales,
  showCreateForm,
  createSale,
  cancelSale
};