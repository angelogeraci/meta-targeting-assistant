const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware d'authentification pour vérifier le token JWT
 */
const auth = async (req, res, next) => {
  try {
    let token;

    // Récupérer le token depuis les cookies ou l'en-tête Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Accès non autorisé, veuillez vous connecter' 
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Ajouter l'utilisateur à la requête
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        });
      }
      
      next();
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Accès non autorisé, token invalide' 
      });
    }
  } catch (err) {
    console.error('Erreur d\'authentification:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de l\'authentification' 
    });
  }
};

// Autoriser certains rôles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à accéder à cette route'
      });
    }
    next();
  };
};

module.exports = auth; 