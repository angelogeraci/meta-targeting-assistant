import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Route Guards
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';

// Public Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Projects from './pages/Projects';

// Admin Pages
import Users from './pages/admin/Users';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={5000} />
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Private Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/projects" element={<Projects />} />
              
              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<Users />} />
              </Route>
              
              {/* Redirect root to projects */}
              <Route path="/" element={<Navigate to="/projects" replace />} />
            </Route>
          </Route>
          
          {/* Redirect any unknown routes to projects */}
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
