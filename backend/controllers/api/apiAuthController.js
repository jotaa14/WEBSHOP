const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { JWT_SECRET } = require('../../middlewares/jwtMiddleware');

const DISTRICTS = [
  'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra',
  'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre',
  'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu'
];

const register = async (req, res) => {
  try {
    const { name, email, phone, nif, password, confirmPassword, address, city, district, birthDay, birthMonth, birthYear } = req.body;

    if (!name || !email || !phone || !nif || !password || !confirmPassword || !district) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'A password deve ter pelo menos 8 caracteres.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'A confirmação da password não coincide.' });
    }

    if (!DISTRICTS.includes(district)) {
      return res.status(400).json({ error: 'Distrito inválido.' });
    }

    if (!/^\d{9}$/.test(nif)) {
      return res.status(400).json({ error: 'NIF inválido. Deve ter 9 dígitos.' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: 'Já existe um utilizador com este email.' });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(409).json({ error: 'Já existe um utilizador com este telefone.' });
    }

    const existingNif = await User.findOne({ nif });
    if (existingNif) {
      return res.status(409).json({ error: 'Já existe um utilizador com este NIF.' });
    }

    if (!birthDay || !birthMonth || !birthYear) {
      return res.status(400).json({ error: 'Data de nascimento obrigatória.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      nif: nif.trim(),
      password,
      address: (address || '').trim(),
      city: (city || '').trim(),
      district: district.trim(),
      birthDate: `${birthDay}/${birthMonth}/${birthYear}`,
      role: 'customer',
      approved: true
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email, district: user.district },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registo efetuado com sucesso.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        district: user.district,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Já existe um utilizador com esses dados.' });
    }
    return res.status(500).json({ error: 'Erro ao registar utilizador.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password são obrigatórios.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ error: 'Esta aplicação é exclusiva para clientes.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email, district: user.district },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login efetuado com sucesso.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        nif: user.nif,
        address: user.address,
        city: user.city,
        district: user.district,
        role: user.role,
        birthDate: user.birthDate
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro no login.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao obter dados do utilizador.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, city, district } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    if (name) user.name = name.trim();
    if (phone) {
      const existingPhone = await User.findOne({ phone: phone.trim(), _id: { $ne: user._id } });
      if (existingPhone) {
        return res.status(409).json({ error: 'Já existe um utilizador com este telefone.' });
      }
      user.phone = phone.trim();
    }
    if (address) user.address = address.trim();
    if (city) user.city = city.trim();
    if (district && DISTRICTS.includes(district)) user.district = district.trim();

    await user.save();

    return res.json({
      message: 'Perfil atualizado com sucesso.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        nif: user.nif,
        address: user.address,
        city: user.city,
        district: user.district,
        role: user.role,
        birthDate: user.birthDate
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'A nova password deve ter pelo menos 8 caracteres.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'A confirmação da nova password não coincide.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'A password atual está incorreta.' });
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      return res.status(400).json({ error: 'A nova password tem de ser diferente da atual.' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password alterada com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao alterar password.' });
  }
};

const getDistricts = (req, res) => {
  return res.json({ districts: DISTRICTS });
};

module.exports = { register, login, getMe, updateProfile, changePassword, getDistricts };
