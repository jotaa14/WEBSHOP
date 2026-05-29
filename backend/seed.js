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
    console.log('Conectado ao MongoDB (pawproject) para Seed...');

    // Limpar dados existentes
    await User.deleteMany({});
    await Supermarket.deleteMany({});
    await Product.deleteMany({});
    console.log('Base de dados limpa.');

    const plainPassword = 'joaoribeiro';

    // 1. ADMIN
    const admin = await User.create({
      name: 'João Ribeiro',
      email: 'joao.jpmr16@gmail.com',
      password: plainPassword,
      role: 'admin',
      nif: '123456789',
      phone: '910000000',
      address: 'Sede PAW',
      city: 'Porto',
      district: 'Porto',
      approved: true
    });

    // 2. CLIENTES
    const clientes = [
      { name: 'Fernando Madureira', email: 'fernandomadureira@gmail.com', phone: '920000001', nif: '200000001' },
      { name: 'José Mourinho', email: 'josemourinho@gmail.com', phone: '920000002', nif: '200000002' },
      { name: 'Bruno Lage', email: 'brunolage@gmail.com', phone: '920000003', nif: '200000003' }
    ];
    for (let c of clientes) {
      await User.create({
        name: c.name, email: c.email, password: plainPassword, role: 'customer',
        nif: c.nif, phone: c.phone, address: 'Rua Principal', city: 'Porto', district: 'Porto', approved: true
      });
    }

    // 3. ESTAFETAS
    const estafetas = [
      { name: 'Trubin', email: 'trubin@gmail.com', phone: '930000001', nif: '300000001' },
      { name: 'João Baião', email: 'joaobaiao@gmail.com', phone: '930000002', nif: '300000002' },
      { name: 'Otamendi', email: 'otamendi@gmail.com', phone: '930000003', nif: '300000003' }
    ];
    for (let e of estafetas) {
      await User.create({
        name: e.name, email: e.email, password: plainPassword, role: 'courier',
        nif: e.nif, phone: e.phone, address: 'Rua Rápida', city: 'Porto', district: 'Porto', approved: true,
        vehicleType: 'carro', vehiclePlate: 'AA-00-AA'
      });
    }

    // 4. SUPERMERCADOS (Users + Lojas)
    const donoSupermercado1 = await User.create({
      name: 'Continente Braga', email: 'continentebraga@gmail.com', password: plainPassword, role: 'supermarket',
      nif: '400000001', phone: '940000001', address: 'Braga Parque', city: 'Braga', district: 'Braga', approved: true
    });
    const super1 = await Supermarket.create({
      user: donoSupermercado1._id, name: 'Continente Braga', description: 'O seu hipermercado', address: 'Braga Parque', city: 'Braga', district: 'Braga', location: 'Shopping', deliveryMethods: ['pickup', 'courier'], pickupCost: 0, courierCost: 3.50, openingHour: 8, openingMinute: 30, closingHour: 22, closingMinute: 0, averageRating: 4.8, totalRatings: 20
    });

    const donoSupermercado2 = await User.create({
      name: 'Pingo Doce Braga', email: 'pingodocebraga@gmail.com', password: plainPassword, role: 'supermarket',
      nif: '400000002', phone: '940000002', address: 'Centro de Braga', city: 'Braga', district: 'Braga', approved: true
    });
    const super2 = await Supermarket.create({
      user: donoSupermercado2._id, name: 'Pingo Doce Braga', description: 'Sabe bem pagar tão pouco', address: 'Centro', city: 'Braga', district: 'Braga', location: 'Baixa', deliveryMethods: ['pickup'], pickupCost: 0, courierCost: 0, openingHour: 9, openingMinute: 0, closingHour: 21, closingMinute: 0, averageRating: 4.2, totalRatings: 15
    });

    const donoSupermercado3 = await User.create({
      name: 'Pingo Doce Porto', email: 'pingodoceporto@gmail.com', password: plainPassword, role: 'supermarket',
      nif: '400000003', phone: '940000003', address: 'Aliados', city: 'Porto', district: 'Porto', approved: true
    });
    const super3 = await Supermarket.create({
      user: donoSupermercado3._id, name: 'Pingo Doce Porto', description: 'No coração do Porto', address: 'Aliados', city: 'Porto', district: 'Porto', location: 'Baixa', deliveryMethods: ['pickup', 'courier'], pickupCost: 0, courierCost: 2.50, openingHour: 8, openingMinute: 0, closingHour: 21, closingMinute: 0, averageRating: 4.5, totalRatings: 30
    });

    // 5. PRODUTOS (Para um dos supermercados para testes)
    const produtosData = [
      { sup: super1._id, name: 'Maçã Fuji', desc: 'Frescas.', price: 1.50, stock: 100, cat: 'Frutas' },
      { sup: super1._id, name: 'Leite Meio Gordo', desc: '1L', price: 0.85, stock: 50, cat: 'Laticínios' },
      { sup: super3._id, name: 'Pão de Forma', desc: '500g', price: 1.20, stock: 30, cat: 'Padaria' },
      { sup: super3._id, name: 'Arroz Agulha', desc: '1Kg', price: 1.10, stock: 80, cat: 'Mercearia' }
    ];

    for (const p of produtosData) {
      await Product.create({
        supermarket: p.sup, name: p.name, description: p.desc, price: p.price, stock: p.stock, category: p.cat
      });
    }

    console.log('Dados inseridos com sucesso na Base de Dados pawproject!');
    console.log('A partir de agora as contas do README vão todas funcionar!');
    process.exit();
  } catch (err) {
    console.error('Erro no seed:', err);
    process.exit(1);
  }
};

seedDB();
