const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Supermarket = require('./models/Supermarket');
const Product = require('./models/Product');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB para Seed...');

    // Limpar dados existentes
    await User.deleteMany({});
    await Supermarket.deleteMany({});
    await Product.deleteMany({});
    console.log('Base de dados limpa.');

    // 1. Criar Utilizadores (Admin, Cliente, Supermercado, Estafeta)
    // O pre-save hook do User.js vai fazer o hash da password automaticamente
    const plainPassword = 'joaoribeiro';

    const admin = await User.create({
      name: 'Administrador Principal',
      email: 'joao.jpmr16@gmail.com',
      password: plainPassword,
      role: 'admin',
      nif: '123456789',
      phone: '910000000',
      address: 'Rua Central, 1',
      city: 'Porto',
      district: 'Porto',
      approved: true
    });

    const cliente = await User.create({
      name: 'João Cliente',
      email: 'fernandomadureira@gmail.com',
      password: plainPassword,
      role: 'customer',
      nif: '234567890',
      phone: '920000000',
      address: 'Avenida Principal, 2',
      city: 'Gaia',
      district: 'Porto',
      approved: true
    });

    const donoSupermercado1 = await User.create({
      name: 'Manuel Pingo',
      email: 'pingodoceporto@gmail.com',
      password: plainPassword,
      role: 'supermarket',
      nif: '345678901',
      phone: '930000000',
      address: 'Rua do Comércio',
      city: 'Porto',
      district: 'Porto',
      approved: true
    });

    const donoSupermercado2 = await User.create({
      name: 'Maria Continente',
      email: 'continentebraga@gmail.com',
      password: plainPassword,
      role: 'supermarket',
      nif: '456789012',
      phone: '940000000',
      address: 'Shopping Center',
      city: 'Matosinhos',
      district: 'Porto',
      approved: true
    });

    const estafeta = await User.create({
      name: 'Carlos Estafeta',
      email: 'trubin@gmail.com',
      password: plainPassword,
      role: 'courier',
      nif: '567890123',
      phone: '950000000',
      address: 'Rua Rápida',
      city: 'Porto',
      district: 'Porto',
      approved: true,
      vehicleType: 'carro',
      vehiclePlate: 'AA-00-AA'
    });

    // 2. Criar Supermercados
    const super1 = await Supermarket.create({
      user: donoSupermercado1._id,
      name: 'Supermercado Central (Pingo)',
      description: 'O teu supermercado de bairro com produtos frescos todos os dias.',
      address: 'Rua das Flores, 123',
      city: 'Porto',
      district: 'Porto',
      location: 'Baixa',
      deliveryMethods: ['pickup', 'courier'],
      pickupCost: 0,
      courierCost: 3.50,
      openingHour: 8,
      openingMinute: 30,
      closingHour: 21,
      closingMinute: 0,
      averageRating: 4.5,
      totalRatings: 10
    });

    const super2 = await Supermarket.create({
      user: donoSupermercado2._id,
      name: 'Hipermercado Matosinhos',
      description: 'Tudo o que precisas num só lugar.',
      address: 'Avenida da Praia, 45',
      city: 'Matosinhos',
      district: 'Porto',
      location: 'Norte',
      deliveryMethods: ['pickup'],
      pickupCost: 0,
      courierCost: 0,
      openingHour: 9,
      openingMinute: 0,
      closingHour: 22,
      closingMinute: 0,
      averageRating: 4.0,
      totalRatings: 5
    });

    // 3. Criar Produtos
    const produtosData = [
      { sup: super1._id, name: 'Maçã Fuji', desc: 'Maçãs frescas e doces.', price: 1.50, stock: 100, cat: 'Frutas' },
      { sup: super1._id, name: 'Leite Meio Gordo', desc: 'Leite nacional 1L', price: 0.85, stock: 50, cat: 'Laticínios' },
      { sup: super1._id, name: 'Pão de Forma', desc: 'Pão fatiado 500g', price: 1.20, stock: 30, cat: 'Padaria' },
      { sup: super1._id, name: 'Arroz Agulha', desc: 'Arroz agulha 1Kg', price: 1.10, stock: 80, cat: 'Mercearia' },
      
      { sup: super2._id, name: 'Maçã Fuji', desc: 'Maçãs embaladas.', price: 1.45, stock: 150, cat: 'Frutas' },
      { sup: super2._id, name: 'Leite Magro', desc: 'Leite nacional 1L', price: 0.90, stock: 60, cat: 'Laticínios' },
      { sup: super2._id, name: 'Detergente Roupa', desc: '50 Doses', price: 9.99, stock: 20, cat: 'Limpeza' },
      { sup: super2._id, name: 'Água Mineral', desc: 'Garrafão 5L', price: 1.50, stock: 200, cat: 'Bebidas' }
    ];

    for (const p of produtosData) {
      await Product.create({
        supermarket: p.sup,
        name: p.name,
        description: p.desc,
        price: p.price,
        stock: p.stock,
        category: p.cat
      });
    }

    console.log('Dados inseridos com sucesso!');
    console.log('\\n------------------------------------');
    console.log('DADOS DE TESTE (Password para todos: joaoribeiro)');
    console.log('Admin: joao.jpmr16@gmail.com');
    console.log('Cliente: fernandomadureira@gmail.com');
    console.log('Supermercado 1: pingodoceporto@gmail.com');
    console.log('Supermercado 2: continentebraga@gmail.com');
    console.log('Estafeta: trubin@gmail.com');
    console.log('------------------------------------\\n');

    process.exit();
  } catch (err) {
    console.error('Erro no seed:', err);
    process.exit(1);
  }
};

seedDB();
