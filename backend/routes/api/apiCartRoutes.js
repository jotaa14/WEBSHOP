const express = require('express');
const router = express.Router();
const apiCartController = require('../../controllers/api/apiCartController');
const { authenticateToken } = require('../../middlewares/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Gestão do carrinho de compras
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Ver carrinho do utilizador
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteúdo do carrinho agrupado por supermercado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupedItems:
 *                   type: object
 *                   description: Items agrupados por supermercado
 *                 total:
 *                   type: number
 *                 cartCount:
 *                   type: number
 */
router.get('/cart', authenticateToken, apiCartController.getCart);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Adicionar produto ao carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID do produto a adicionar
 *               quantity:
 *                 type: number
 *                 default: 1
 *                 description: Quantidade a adicionar
 *     responses:
 *       200:
 *         description: Produto adicionado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 cartCount:
 *                   type: number
 *       400:
 *         description: Stock insuficiente
 *       404:
 *         description: Produto não encontrado
 */
router.post('/cart/add', authenticateToken, apiCartController.addToCart);

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Atualizar quantidade de um produto no carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Carrinho atualizado
 *       400:
 *         description: Stock insuficiente
 *       404:
 *         description: Produto não encontrado no carrinho
 */
router.put('/cart/update', authenticateToken, apiCartController.updateCartItem);

/**
 * @swagger
 * /api/cart/remove/{productId}:
 *   delete:
 *     summary: Remover produto do carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto a remover
 *     responses:
 *       200:
 *         description: Produto removido
 *       404:
 *         description: Carrinho não encontrado
 */
router.delete('/cart/remove/:productId', authenticateToken, apiCartController.removeCartItem);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Limpar todo o carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrinho limpo
 */
router.delete('/cart/clear', authenticateToken, apiCartController.clearCart);

module.exports = router;
