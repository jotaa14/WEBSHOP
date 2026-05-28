const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const methodOverride = require('method-override');
const cors = require('cors');

const connectDB = require('./config/db');

// EJS Routes (Backoffice)
const profileRoutes = require('./routes/profileRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supermarketRoutes = require('./routes/supermarketRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const courierRoutes = require('./routes/courierRoutes');
const customerMarketplaceRoutes = require('./routes/customerMarketplaceRoutes');
const supportRoutes = require('./routes/supportRoutes');

// API Routes (Frontoffice)
const apiAuthRoutes = require('./routes/api/apiAuthRoutes');
const apiSupermarketRoutes = require('./routes/api/apiSupermarketRoutes');
const apiProductRoutes = require('./routes/api/apiProductRoutes');
const apiCartRoutes = require('./routes/api/apiCartRoutes');
const apiOrderRoutes = require('./routes/api/apiOrderRoutes');

// Swagger
const { specs, swaggerUi } = require('./config/swagger');

dotenv.config();
connectDB();

const app = express();

// CORS - permitir requisições do Angular (porta 4200)
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo123',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PAW Marketplace API Docs'
}));

app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  return res.redirect('/dashboard');
});

// EJS Routes (Backoffice)
app.use(profileRoutes);
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', adminRoutes);
app.use('/', supermarketRoutes);
app.use('/', productRoutes);
app.use('/', saleRoutes);
app.use('/', courierRoutes);
app.use('/', customerMarketplaceRoutes);
app.use('/', supportRoutes);

// API Routes (Frontoffice REST)
app.use('/api', apiAuthRoutes);
app.use('/api', apiSupermarketRoutes);
app.use('/api', apiProductRoutes);
app.use('/api', apiCartRoutes);
app.use('/api', apiOrderRoutes);

app.use((req, res) => {
  res.status(404).send('Página não encontrada.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
  console.log(`Swagger docs em http://localhost:${PORT}/api-docs`);
});