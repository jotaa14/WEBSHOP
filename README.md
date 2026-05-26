# PAW PROJECT — Marketplace de Supermercados

Repositório do trabalho prático de Programação em Ambiente Web (PAW) — Arquitetura Full-Stack (Angular + Node.js).

## 🚀 Arquitetura e Separação de Ambientes

O projeto evoluiu para uma arquitetura full-stack moderna, com separação estrita de acessos para garantir segurança e melhor experiência de utilização:

*   **🌐 Frontend Web App (Angular)** — Exclusivo para **Clientes**.
*   **🏢 Backoffice de Gestão (Node.js + EJS)** — Exclusivo para **Supermercados, Estafetas e Administradores**.

---

## ✨ Funcionalidades Principais

A plataforma suporta quatro perfis de utilizador distintos:

*   **👩‍💻 Cliente (Frontend Angular):**
    *   Registo e Login (API + JWT) com geolocalização por distrito.
    *   Interface rica em estilo *Dark Glassmorphism*.
    *   Navegação e filtragem avançada de produtos.
    *   Sistema de carrinho de compras dinâmico e otimizado.
    *   Checkout com escolha de método de entrega (Levantamento ou Entrega ao domicílio) com cálculo de portes.
    *   Histórico de encomendas, avaliações a lojas/estafetas e devoluções.

*   **🏪 Supermercado (Backoffice):**
    *   Gestão de catálogo (Produtos e Categorias).
    *   Gestão de stock e preços.
    *   Processamento de encomendas (Aceitar, Preparar, Enviar).
    *   Sistema POS (Vendas em caixa) para registo de compras físicas locais.
    *   Gestão de devoluções.
    *   Consulta de estatísticas e painel analítico.

*   **🛵 Estafeta (Backoffice):**
    *   Acesso a entregas disponíveis no distrito de atuação.
    *   Atualização de estados de entrega em tempo real.
    *   Consulta de histórico de serviços e avaliações recebidas.

*   **⚙️ Administrador (Backoffice):**
    *   Validação e aprovação de novos supermercados e estafetas.
    *   Gestão global de utilizadores e moderação de conteúdos (Avaliações).
    *   **Monitorização de Atividades (Audit Log):** Registo detalhado de todos os movimentos críticos (vendas, alterações de stock, etc).
    *   **Centro de Suporte:** Sistema de tickets para responder a pedidos de ajuda de todos os utilizadores.

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend (Cliente):** Angular 17/18 (Standalone Components), RxJS, TailwindCSS/Vanilla CSS nativo (Estilos Glassmorphism e responsivos).
*   **Backend & Backoffice:** Node.js, Express.js, EJS (Templates).
*   **Base de Dados:** MongoDB (via Mongoose).
*   **Autenticação Dupla:** 
    *   `JWT (JSON Web Tokens)` para a API REST do Frontend.
    *   `Express-Session` para as interfaces administrativas do Backoffice.
*   **Segurança:** Encriptação de passwords com Bcrypt, validações robustas e bloqueio estrito de papéis (Role-based access).
*   **Documentação API:** Swagger UI (disponível na rota `/api-docs`).

---

## ⚙️ Como Executar o Projeto

Como o projeto está dividido em duas partes, necessitas de executar dois servidores em simultâneo (em terminais separados).

### 1. Requisitos
*   [Node.js](https://nodejs.org/) instalado.
*   Servidor [MongoDB](https://www.mongodb.com/) ativo localmente (porta 27017).

### 2. Iniciar o Backend / Backoffice
Abre o primeiro terminal e corre:
```bash
cd backend
npm install
node app.js
```
* O Servidor e Backoffice ficarão disponíveis em `http://localhost:3000`
* A Documentação da API fica disponível em `http://localhost:3000/api-docs`

### 3. Iniciar o Frontend (Aplicação Cliente)
Abre o segundo terminal e corre:
```bash
cd frontend
npm install
npm start
```
* A aplicação cliente ficará disponível em `http://localhost:4200`

---

## 🔑 Contas de Teste

Podes usar as seguintes contas pré-configuradas para testar os diferentes fluxos da aplicação (a password para todas é `joaoribeiro`):

| Perfil | Email | Onde Fazer Login |
| :--- | :--- | :--- |
| **Admin** | joao.jpmr16@gmail.com | [http://localhost:3000](http://localhost:3000) |
| **Supermercado** | continentebraga@gmail.com | [http://localhost:3000](http://localhost:3000) |
| **Supermercado** | pingodocebraga@gmail.com | [http://localhost:3000](http://localhost:3000) |
| **Supermercado** | pingodoceporto@gmail.com | [http://localhost:3000](http://localhost:3000) |
| **Estafeta** | trubin@gmail.com | [http://localhost:3000](http://localhost:3000) |
| **Estafeta** | joaobaiao@gmail.com | [http://localhost:3000](http://localhost:3000) |
| **Estafeta** | otamendi@gmail.com | [http://localhost:3000](http://localhost:3000) |
| **Cliente** | fernandomadureira@gmail.com | [http://localhost:4200](http://localhost:4200) |
| **Cliente** | josemourinho@gmail.com | [http://localhost:4200](http://localhost:4200) |
| **Cliente** | brunolage@gmail.com | [http://localhost:4200](http://localhost:4200) |