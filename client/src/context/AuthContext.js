import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios with token
  useEffect(() => {
    // Définir l'URL de base pour toutes les requêtes axios
    axios.defaults.baseURL = 'http://localhost:5001';
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      console.log('Token set in axios headers:', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      console.log('No token available, removed from axios headers');
    }
    
    // Intercepteur pour ajouter le token à chaque requête
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    
    return () => {
      // Nettoyer l'intercepteur lors du démontage du composant
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Load user data from API if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Loading user with token:', token);
        const res = await axios.get('/api/auth/me');
        if (res.data && res.data.data) {
          console.log('User loaded successfully:', res.data.data);
          setCurrentUser(res.data.data);
        } else {
          console.error('Invalid response format:', res.data);
          setError('Erreur lors du chargement des données utilisateur');
          logout();
        }
      } catch (err) {
        console.error('Failed to load user:', err.response?.data || err.message);
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/auth/register', userData);
      
      if (res.data.success) {
        setToken(res.data.token);
        setCurrentUser(res.data.user);
        toast.success('Inscription réussie!');
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/auth/login', { email, password });
      
      if (res.data.success) {
        console.log('Login successful, token received:', res.data.token);
        setToken(res.data.token);
        setCurrentUser(res.data.user);
        toast.success('Connexion réussie!');
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Identifiants invalides';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.info('Vous êtes déconnecté');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!currentUser;
  };

  // Check if user is admin
  const isAdmin = () => {
    return isAuthenticated() && currentUser.role === 'admin';
  };

  // Get all users (admin only)
  const getUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/users');
      return res.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la récupération des utilisateurs';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create a new user (admin only)
  const createUser = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/users', userData);
      if (res.data.success) {
        toast.success('Utilisateur créé avec succès!');
        return res.data.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user (admin only)
  const updateUser = async (id, userData) => {
    try {
      setLoading(true);
      const res = await axios.put(`/api/auth/users/${id}`, userData);
      if (res.data.success) {
        toast.success('Utilisateur mis à jour avec succès!');
        return res.data.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete user (admin only)
  const deleteUser = async (id) => {
    try {
      setLoading(true);
      const res = await axios.delete(`/api/auth/users/${id}`);
      if (res.data.success) {
        toast.success('Utilisateur supprimé avec succès!');
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        getUsers,
        createUser,
        updateUser,
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
