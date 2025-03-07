const socketIo = require('socket.io');

let io;

/**
 * Initialise le service WebSocket
 * @param {object} server - Instance du serveur HTTP
 */
function init(server) {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Nouvelle connexion WebSocket établie');
    
    socket.on('disconnect', () => {
      console.log('Connexion WebSocket fermée');
    });
  });

  console.log('Service WebSocket initialisé');
  return io;
}

/**
 * Envoie une mise à jour de progression
 * @param {string} event - Nom de l'événement
 * @param {object} data - Données à envoyer
 */
function emitProgress(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  init,
  emitProgress,
  getIo: () => io
};
