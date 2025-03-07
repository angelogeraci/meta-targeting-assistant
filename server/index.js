const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketService = require('./services/socket');

// Configuration des variables d'environnement
dotenv.config();

// Import des routes
const criteriaRoutes = require('./routes/criteria');
const metaRoutes = require('./routes/meta');

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);

// Initialisation de Socket.io
socketService.init(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/criteria', criteriaRoutes);
app.use('/api/meta', metaRoutes);

// Route par défaut
app.get('/', (req, res) => {
  res.send('API Meta Targeting Assistant');
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Erreur serveur');
});

// Port du serveur
const PORT = process.env.PORT || 5000;

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Socket.IO est actif pour les mises à jour en temps réel`);
});

module.exports = { app, server };
