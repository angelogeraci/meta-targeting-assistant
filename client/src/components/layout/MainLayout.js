import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Navbar, Nav, Container, Dropdown, 
  Button, Offcanvas, Badge, Tooltip, OverlayTrigger 
} from 'react-bootstrap';
import { 
  FaSearchLocation, FaUser, FaUsers, FaSignOutAlt, 
  FaTachometerAlt, FaChartLine, FaBars, FaUserCog, FaProjectDiagram 
} from 'react-icons/fa';
import AuthContext from '../../context/AuthContext';

const MainLayout = () => {
  const { currentUser, logout, isAdmin } = useContext(AuthContext);
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCloseSidebar = () => setShowSidebar(false);
  const handleShowSidebar = () => setShowSidebar(true);

  // Vérifier si le lien est actif
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Générer les initiales de l'utilisateur
  const getInitials = () => {
    if (!currentUser) return 'U';
    return `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`;
  };

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-3">
        <Container>
          <Button 
            variant="link" 
            className="text-white me-2 p-0 d-lg-none"
            onClick={handleShowSidebar}
          >
            <FaBars size={20} />
          </Button>
          
          <Navbar.Brand as={Link} to="/dashboard">
            <FaSearchLocation className="me-2" />
            Meta Targeting Assistant
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="main-nav" />
          
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                to="/dashboard" 
                className={isActive('/dashboard') ? 'active fw-bold' : ''}
              >
                <FaTachometerAlt className="me-1" /> Tableau de bord
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/projects" 
                className={isActive('/projects') ? 'active fw-bold' : ''}
              >
                <FaProjectDiagram className="me-1" /> Projets
              </Nav.Link>
              
              {isAdmin() && (
                <Nav.Link 
                  as={Link} 
                  to="/admin/users" 
                  className={isActive('/admin/users') ? 'active fw-bold' : ''}
                >
                  <FaUsers className="me-1" /> Utilisateurs
                </Nav.Link>
              )}
            </Nav>
            
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle as="div" className="user-dropdown d-flex align-items-center">
                  <div className="user-avatar me-2">
                    {getInitials()}
                  </div>
                  <div className="d-none d-md-block">
                    <div className="fw-medium text-white">{currentUser?.firstName} {currentUser?.lastName}</div>
                    <div className="small text-white-50">
                      {currentUser?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                    </div>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Header>
                    {currentUser?.email}
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/profile">
                    <FaUserCog className="me-2" /> Mon profil
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" /> Déconnexion
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Sidebar mobile - uniquement visible sur les petits écrans */}
      <Offcanvas show={showSidebar} onHide={handleCloseSidebar} className="d-lg-none">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              className={isActive('/dashboard') ? 'active fw-bold' : ''}
              onClick={handleCloseSidebar}
            >
              <FaTachometerAlt className="me-2" /> Tableau de bord
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/projects" 
              className={isActive('/projects') ? 'active fw-bold' : ''}
              onClick={handleCloseSidebar}
            >
              <FaProjectDiagram className="me-2" /> Projets
            </Nav.Link>
            
            {isAdmin() && (
              <Nav.Link 
                as={Link} 
                to="/admin/users" 
                className={isActive('/admin/users') ? 'active fw-bold' : ''}
                onClick={handleCloseSidebar}
              >
                <FaUsers className="me-2" /> Gestion des utilisateurs
              </Nav.Link>
            )}
            
            <hr />
            
            <Nav.Link 
              as={Link} 
              to="/profile" 
              className={isActive('/profile') ? 'active fw-bold' : ''}
              onClick={handleCloseSidebar}
            >
              <FaUserCog className="me-2" /> Mon profil
            </Nav.Link>
            
            <Nav.Link onClick={() => { handleLogout(); handleCloseSidebar(); }}>
              <FaSignOutAlt className="me-2" /> Déconnexion
            </Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Contenu principal */}
      <main className="py-3">
        <Container>
          <Outlet />
        </Container>
      </main>

      {/* Pied de page */}
      <footer className="bg-light py-4 mt-5">
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="mb-3 mb-md-0">
              <p className="mb-0 text-muted">
                &copy; {new Date().getFullYear()} Meta Targeting Assistant
              </p>
            </div>
            <div>
              <a href="#" className="text-decoration-none text-muted me-3">
                Confidentialité
              </a>
              <a href="#" className="text-decoration-none text-muted">
                Conditions d'utilisation
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
};

export default MainLayout;
