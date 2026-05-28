const express = require('express');
const router = express.Router();
const apiSupermarketController = require('../../controllers/api/apiSupermarketController');
const { authenticateToken } = require('../../middlewares/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Supermarkets
 *   description: Pesquisa e consulta de supermercados
 */

/**
 * @swagger
 * /api/supermarkets:
 *   get:
 *     summary: Listar supermercados
 *     tags: [Supermarkets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrar por nome
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         description: Filtrar por distrito
 *       - in: query
 *         name: openNow
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filtrar apenas abertos agora
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, az, za, rating]
 *         description: Ordenação
 *     responses:
 *       200:
 *         description: Lista de supermercados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supermarkets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supermarket'
 */
router.get('/supermarkets', authenticateToken, apiSupermarketController.listSupermarkets);

/**
 * @swagger
 * /api/supermarkets/{id}:
 *   get:
 *     summary: Detalhes de um supermercado
 *     tags: [Supermarkets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do supermercado
 *     responses:
 *       200:
 *         description: Detalhes do supermercado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supermarket:
 *                   $ref: '#/components/schemas/Supermarket'
 *       404:
 *         description: Supermercado não encontrado
 */
router.get('/supermarkets/:id', authenticateToken, apiSupermarketController.getSupermarket);

/**
 * @swagger
 * /api/supermarkets/{id}/products:
 *   get:
 *     summary: Produtos de um supermercado
 *     tags: [Supermarkets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [az, za, priceAsc, priceDesc]
 *     responses:
 *       200:
 *         description: Lista de produtos do supermercado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/supermarkets/:id/products', authenticateToken, apiSupermarketController.getSupermarketProducts);

/**
 * @swagger
 * /api/supermarkets/{id}/reviews:
 *   get:
 *     summary: Avaliações de um supermercado
 *     tags: [Supermarkets]
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
 *         description: Lista de avaliações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 */
router.get('/supermarkets/:id/reviews', authenticateToken, apiSupermarketController.getSupermarketReviews);

module.exports = router;
