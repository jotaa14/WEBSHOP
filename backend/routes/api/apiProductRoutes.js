const express = require('express');
const router = express.Router();
const apiProductController = require('../../controllers/api/apiProductController');
const { authenticateToken } = require('../../middlewares/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Pesquisa e consulta de produtos
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar e pesquisar produtos
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrar por nome do produto
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: supermarket
 *         schema:
 *           type: string
 *         description: Filtrar por ID do supermercado
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Preço mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Preço máximo
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [az, za, priceAsc, priceDesc]
 *         description: Ordenação
 *     responses:
 *       200:
 *         description: Lista de produtos
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
 *                 supermarkets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supermarket'
 */
router.get('/products', authenticateToken, apiProductController.listProducts);

/**
 * @swagger
 * /api/products/compare/{name}:
 *   get:
 *     summary: Comparar preços de um produto em vários supermercados
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome exato do produto a comparar
 *     responses:
 *       200:
 *         description: Lista de produtos com o mesmo nome em supermercados diferentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productName:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       400:
 *         description: Nome do produto não especificado
 */
router.get('/products/compare/:name', authenticateToken, apiProductController.compareProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Detalhes de um produto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Detalhes do produto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produto não encontrado
 */
router.get('/products/:id', authenticateToken, apiProductController.getProduct);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Listar categorias disponíveis
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/categories', authenticateToken, apiProductController.listCategories);

module.exports = router;
