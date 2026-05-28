const express = require('express');
const router = express.Router();
const apiOrderController = require('../../controllers/api/apiOrderController');
const { authenticateToken } = require('../../middlewares/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestão de encomendas do cliente
 */

/**
 * @swagger
 * /api/orders/checkout:
 *   post:
 *     summary: Finalizar encomenda (checkout)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryMethods:
 *                 type: object
 *                 description: "Objeto com ID do supermercado como chave e método de entrega como valor. Ex: {\"supermarketId\": \"courier\"}"
 *                 additionalProperties:
 *                   type: string
 *                   enum: [pickup, courier]
 *     responses:
 *       201:
 *         description: Encomenda(s) criada(s) com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       400:
 *         description: Carrinho vazio ou stock insuficiente
 */
router.post('/orders/checkout', authenticateToken, apiOrderController.checkout);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Listar encomendas do cliente
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de encomendas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */
router.get('/orders', authenticateToken, apiOrderController.listOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Detalhes de uma encomenda
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da encomenda
 *     responses:
 *       200:
 *         description: Detalhes da encomenda incluindo review e devoluções
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Encomenda não encontrada
 */
router.get('/orders/:id', authenticateToken, apiOrderController.getOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   get:
 *     summary: Estado atual de uma encomenda (web service para polling)
 *     description: Endpoint otimizado para consulta frequente do estado da encomenda. Retorna apenas o status, método de entrega, estafeta e data de atualização.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado atual da encomenda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [pending, confirmed, preparing, ready_for_pickup, delivering, delivered, cancelled]
 *                 deliveryMethod:
 *                   type: string
 *                   enum: [pickup, courier]
 *                 courier:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Encomenda não encontrada
 */
router.get('/orders/:id/status', authenticateToken, apiOrderController.getOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancelar uma encomenda
 *     description: Apenas encomendas pendentes podem ser canceladas, ou confirmadas dentro de 5 minutos após confirmação.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Encomenda cancelada
 *       400:
 *         description: Encomenda não pode ser cancelada
 *       404:
 *         description: Encomenda não encontrada
 */
router.post('/orders/:id/cancel', authenticateToken, apiOrderController.cancelOrder);

/**
 * @swagger
 * /api/orders/{id}/review:
 *   post:
 *     summary: Submeter avaliação de uma encomenda
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supermarketRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               courierRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               supermarketComment:
 *                 type: string
 *               courierComment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Avaliação guardada
 *       400:
 *         description: Encomenda não está no estado correto
 *       404:
 *         description: Encomenda não encontrada
 *   get:
 *     summary: Ver avaliação existente de uma encomenda
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Avaliação existente ou null
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 */
router.post('/orders/:id/review', authenticateToken, apiOrderController.submitReview);
router.get('/orders/:id/review', authenticateToken, apiOrderController.getReview);

/**
 * @swagger
 * /api/orders/return:
 *   post:
 *     summary: Pedir devolução de um produto
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, productId, quantity, condition]
 *             properties:
 *               orderId:
 *                 type: string
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *               condition:
 *                 type: string
 *                 enum: [good, damaged]
 *     responses:
 *       201:
 *         description: Pedido de devolução criado
 *       400:
 *         description: Quantidade ou estado inválido
 *       404:
 *         description: Encomenda ou artigo não encontrado
 */
router.post('/orders/return', authenticateToken, apiOrderController.requestReturn);

module.exports = router;
