const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Charger les variables d'environnement
dotenv.config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connecté pour le seeding'))
  .catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });

// Données utilisateur admin
const adminUser = {
  firstName: 'Angelo',
  lastName: 'Geraci',
  email: 'ageraci.finance@gmail.com',
  password: 'MetaAdmin2025!',
  role: 'admin',
  active: true
};

// Données utilisateur standard
const regularUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@example.com',
  password: 'password123',
  role: 'user',
  active: true
};

// Fonction d'importation des utilisateurs
const importUsers = async () => {
  try {
    // Supprimer les utilisateurs existants
    await User.deleteMany();
    console.log('Utilisateurs supprimés');

    // Créer l'utilisateur admin
    await User.create(adminUser);
    console.log(`Utilisateur admin créé: ${adminUser.email}`);

    // Créer l'utilisateur standard
    await User.create(regularUser);
    console.log(`Utilisateur standard créé: ${regularUser.email}`);

    console.log('Importation terminée !');
    process.exit();
  } catch (err) {
    console.error('Erreur lors de l\'importation:', err);
    process.exit(1);
  }
};

// Exécuter l'importation
importUsers();
