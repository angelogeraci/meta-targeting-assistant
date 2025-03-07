import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;

class SocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {};
  }

  /**
   * Initialise la connexion au serveur WebSocket
   */
  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL);

    this.socket.on('connect', () => {
      console.log('Connexion WebSocket établie');
    });

    this.socket.on('disconnect', () => {
      console.log('Connexion WebSocket fermée');
    });

    this.socket.on('error', (error) => {
      console.error('Erreur WebSocket:', error);
    });

    // Écoute des mises à jour de progression Meta
    this.socket.on('meta-progress', (data) => {
      if (this.callbacks['meta-progress']) {
        this.callbacks['meta-progress'].forEach(callback => callback(data));
      }
    });
  }

  /**
   * Déconnecte du serveur WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * S'abonne à un événement
   * @param {string} event - Nom de l'événement
   * @param {function} callback - Fonction de rappel
   * @returns {function} - Fonction pour se désabonner
   */
  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }

    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }

    this.callbacks[event].push(callback);

    // Retourner une fonction pour se désabonner
    return () => {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    };
  }
}

// Export d'une instance singleton
const socketService = new SocketService();
export default socketService;
