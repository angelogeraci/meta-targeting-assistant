require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schéma utilisateur
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  firstName: String,
  lastName: String
});

const User = mongoose.model('User', userSchema);

async function initAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('L\'administrateur existe déjà');
      return;
    }

    // Créer l'admin
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    const admin = new User({
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    });

    await admin.save();
    console.log('Administrateur créé avec succès');

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.connection.close();
  }
}

initAdmin(); 