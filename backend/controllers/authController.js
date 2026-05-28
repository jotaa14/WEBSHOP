const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Supermarket = require('../models/Supermarket');

const DISTRICTS = [
  'Aveiro',
  'Beja',
  'Braga',
  'Bragança',
  'Castelo Branco',
  'Coimbra',
  'Évora',
  'Faro',
  'Guarda',
  'Leiria',
  'Lisboa',
  'Portalegre',
  'Porto',
  'Santarém',
  'Setúbal',
  'Viana do Castelo',
  'Vila Real',
  'Viseu'
];

const getSingleValue = (value) => {
  if (Array.isArray(value)) {
    return value[value.length - 1];
  }
  return value;
};

const cleanValue = (value) => String(getSingleValue(value) || '').trim();

const showRegister = (req, res) => {
  res.render('auth/register', { districts: DISTRICTS });
};

const register = async (req, res) => {
  try {
    const role = cleanValue(req.body.role);
    const name = cleanValue(req.body.name);
    const supermarketName = cleanValue(req.body.supermarketName);
    const birthDay = cleanValue(req.body.birthDay);
    const birthMonth = cleanValue(req.body.birthMonth);
    const birthYear = cleanValue(req.body.birthYear);
    const nif = cleanValue(req.body.nif);
    const phone = cleanValue(req.body.phone);
    const email = cleanValue(req.body.email).toLowerCase();
    const password = cleanValue(req.body.password);
    const confirmPassword = cleanValue(req.body.confirmPassword);
    const vehicleType = cleanValue(req.body.vehicleType);
    const vehicleBrand = cleanValue(req.body.vehicleBrand);
    const vehiclePlate = cleanValue(req.body.vehiclePlate).toUpperCase();
    const courierCostRaw = cleanValue(req.body.courierCost);

    let address = '';
    let city = '';
    let district = '';

    if (role === 'customer') {
      address = cleanValue(req.body.customerAddress);
      city = cleanValue(req.body.customerCity);
      district = cleanValue(req.body.customerDistrict);
    }

    if (role === 'courier') {
      address = cleanValue(req.body.courierAddress);
      city = cleanValue(req.body.courierCity);
      district = cleanValue(req.body.courierDistrict);
    }

    if (role === 'supermarket') {
      address = cleanValue(req.body.supermarketAddress);
      city = cleanValue(req.body.supermarketCity);
      district = cleanValue(req.body.supermarketDistrict);
    }

    if (!role || !['courier', 'supermarket'].includes(role)) {
      return res.render('auth/access-denied', {
        title: 'Registo Indisponível',
        message: 'O registo de clientes é feito exclusivamente na nossa aplicação web. Esta plataforma destina-se apenas a supermercados e estafetas.',
        redirectUrl: 'http://localhost:4200/register',
        buttonText: 'Registar na App'
      });
    }

    if (!email) return res.send('Falta o email.');
    if (!phone) return res.send('Falta o telefone.');
    if (!password) return res.send('Falta a password.');
    if (!confirmPassword) return res.send('Falta a confirmação da password.');
    if (!district) return res.send('Falta o distrito.');

    if (password.length < 8) {
      return res.send('A password deve ter pelo menos 8 caracteres.');
    }

    if (password !== confirmPassword) {
      return res.send('A confirmação da password não coincide.');
    }

    if (!DISTRICTS.includes(district)) {
      return res.send('Distrito inválido.');
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.send('Já existe um utilizador com este email.');
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.send('Já existe um utilizador com este telefone.');
    }

    if (!nif || !/^\d{9}$/.test(nif)) {
      return res.send('NIF inválido. Deve ter 9 dígitos.');
    }

    const existingNif = await User.findOne({ nif });
    if (existingNif) {
      return res.send('Já existe um utilizador com este NIF.');
    }

    let finalName = '';
    let finalBirthDate = null;
    let finalAddress = '';
    let finalCity = '';
    let finalApproved = false;

    const hasBirthDate = birthDay && birthMonth && birthYear;

    if ((role === 'customer' || role === 'courier') && !hasBirthDate) {
      return res.send('Preenche a data de nascimento.');
    }

    if (role === 'customer' || role === 'courier') {
      if (!name || !address || !city) {
        return res.send('Preenche todos os campos obrigatórios.');
      }

      finalName = name;
      finalAddress = address;
      finalCity = city;
      finalBirthDate = `${birthDay}/${birthMonth}/${birthYear}`;
      finalApproved = role === 'customer';
    }

    if (role === 'courier') {
      if (!vehicleType || !vehicleBrand || !vehiclePlate) {
        return res.send('Preenche todos os dados do veículo.');
      }

      if (!['carro', 'mota'].includes(vehicleType)) {
        return res.send('Tipo de veículo inválido.');
      }
    }

    if (role === 'supermarket') {
      if (!supermarketName || !address || !city) {
        return res.send('Preenche todos os campos obrigatórios do supermercado.');
      }

      finalName = supermarketName;
      finalAddress = address;
      finalCity = city;
      finalApproved = false;
    }

    const userData = {
      name: finalName,
      birthDate: finalBirthDate,
      email,
      phone,
      nif,
      address: finalAddress,
      city: finalCity,
      district,
      password,
      role,
      approved: finalApproved
    };

    if (role === 'courier') {
      userData.vehicleType = vehicleType;
      userData.vehicleBrand = vehicleBrand;
      userData.vehiclePlate = vehiclePlate;
    }

    const user = await User.create(userData);

    if (role === 'supermarket') {
      const shippingCost = Number(courierCostRaw);

      if (!Number.isFinite(shippingCost) || shippingCost < 0) {
        await User.findByIdAndDelete(user._id);
        return res.send('Custo de envio inválido.');
      }

      await Supermarket.create({
        user: user._id,
        name: supermarketName,
        location: address,
        city,
        district,
        courierCost: shippingCost
      });
    }

    return res.redirect('/login');
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.send('Já existe um utilizador com esses dados.');
    }

    return res.send('Erro ao registar utilizador.');
  }
};

const showLogin = (req, res) => {
  res.render('auth/login');
};

const login = async (req, res) => {
  try {
    const email = cleanValue(req.body.email).toLowerCase();
    const password = cleanValue(req.body.password);

    const user = await User.findOne({ email });

    if (!user) {
      return res.send('Credenciais inválidas.');
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.send('Credenciais inválidas.');
    }

    if (user.role === 'customer') {
      return res.render('auth/access-denied', {
        title: 'Acesso Restrito',
        message: 'Esta plataforma é exclusiva para supermercados, estafetas e administradores. Como cliente, deves utilizar a nossa aplicação web para fazer compras.',
        redirectUrl: 'http://localhost:4200/login',
        buttonText: 'Ir para a App de Cliente'
      });
    }

    req.session.user = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      district: user.district
    };

    return res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    return res.send('Erro no login.');
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = {
  showRegister,
  register,
  showLogin,
  login,
  logout
};