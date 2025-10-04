const express = require("express");
const app = express();
const router = require("./routes/authRoutes");
const { swaggerUi, specs } = require('./config/swagger');
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Paxify API Documentation'
}));

// Routes
app.use(router);

app.listen(port, () => {
  console.log(`Server has started, listening on http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});
