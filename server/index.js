const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const socketService = require('./services/socket');

// Configuration des variables d'environnement
dotenv.config();

// Import des routes
const criteriaRoutes = require('./routes/criteria');
const metaRoutes = require('./routes/meta');
const { router: authRoutes, protect } = require('./routes/auth');

// Connexion à MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);

// Initialisation de Socket.io
socketService.init(server);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/criteria', protect, criteriaRoutes);
app.use('/api/meta', protect, metaRoutes);
app.use('/api/auth', authRoutes);

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
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Socket.IO est actif pour les mises à jour en temps réel`);
  });
};

startServer();

module.exports = { app, server };
