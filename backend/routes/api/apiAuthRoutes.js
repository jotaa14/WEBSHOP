const express = require('express');
const router = express.Router();
const apiAuthController = require('../../controllers/api/apiAuthController');
const { authenticateToken } = require('../../middlewares/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação e gestão de conta do cliente
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registar novo cliente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, nif, password, confirmPassword, district, birthDay, birthMonth, birthYear]
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *               phone:
 *                 type: string
 *                 example: "912345678"
 *               nif:
 *                 type: string
 *                 example: "123456789"
 *               password:
 *                 type: string
 *                 example: password123
 *               confirmPassword:
 *                 type: string
 *                 example: password123
 *               address:
 *                 type: string
 *                 example: Rua das Flores, 10
 *               city:
 *                 type: string
 *                 example: Porto
 *               district:
 *                 type: string
 *                 example: Porto
 *               birthDay:
 *                 type: string
 *                 example: "15"
 *               birthMonth:
 *                 type: string
 *                 example: "06"
 *               birthYear:
 *                 type: string
 *                 example: "1990"
 *     responses:
 *       201:
 *         description: Registo efetuado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Utilizador já existe
 */
router.post('/auth/register', apiAuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login do cliente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login efetuado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciais inválidas
 *       403:
 *         description: Acesso restrito a clientes
 */
router.post('/auth/login', apiAuthController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter dados do utilizador autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do utilizador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autenticado
 */
router.get('/auth/me', authenticateToken, apiAuthController.getMe);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Atualizar perfil do utilizador
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *       401:
 *         description: Não autenticado
 */
router.put('/auth/profile', authenticateToken, apiAuthController.updateProfile);

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Alterar password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmNewPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmNewPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password alterada
 *       401:
 *         description: Password atual incorreta
 */
router.put('/auth/password', authenticateToken, apiAuthController.changePassword);

/**
 * @swagger
 * /api/auth/districts:
 *   get:
 *     summary: Listar distritos disponíveis
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Lista de distritos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 districts:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/auth/districts', apiAuthController.getDistricts);

module.exports = router;
