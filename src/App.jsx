import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { MenuProvider } from './context/MenuContext';
import { OrderProvider } from './context/OrderContext';
import { BlogProvider } from './context/BlogContext';
import Layout from './layout/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import Catering from './pages/Catering';
import MenuConfigurator from './pages/MenuConfigurator';
import Saloane from './pages/Saloane';
import EventsServices from './pages/EventsServices';
import BlogList from './pages/blog/BlogList';
import BlogPost from './pages/blog/BlogPost';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventDetail from './pages/admin/AdminEventDetail';
import AdminPOS from './pages/admin/components/AdminPOS';
import Terms from './pages/legal/Terms';
import DataSecurity from './pages/legal/DataSecurity';
import ConfidentialityPage from './pages/legal/ConfidentialityPage';
import RefundPolicy from './pages/legal/RefundPolicy';
import DeliveryPolicy from './pages/legal/DeliveryPolicy';
import CommercePolicy from './pages/legal/CommercePolicy';
import DriverApplication from './pages/careers/DriverApplication';
import DriverLogin from './pages/driver/DriverLogin';
import DriverDashboard from './pages/driver/DriverDashboard';
import GuestPortal from './pages/GuestPortal';
import ReservationPage from './pages/ReservationPage';
import ScrollToTop from './components/ScrollToTop';
import PageTitleUpdater from './components/PageTitleUpdater';
import './index.css';

const ProtectedAdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('admin_token');
  return isAuthenticated ? children : <Navigate to="/admin/login" />;
};

function App() {
  return (
    <AuthProvider>
      <MenuProvider>
        <OrderProvider>
          <CartProvider>
            <BlogProvider>
              <Router>
                <ScrollToTop />
                <PageTitleUpdater />
                <Routes>
                  {/* Public Routes with Layout */}
                  <Route path="/" element={<Layout><Home /></Layout>} />
                  <Route path="/produse" element={<Layout><Products /></Layout>} />
                  <Route path="/produs/:id" element={<Layout><ProductDetails /></Layout>} />
                  <Route path="/catering" element={<Layout><Catering /></Layout>} />
                  <Route path="/configurator" element={<Layout><MenuConfigurator /></Layout>} />
                  <Route path="/saloane" element={<Layout><Saloane /></Layout>} />
                  <Route path="/servicii-evenimente" element={<Layout><EventsServices /></Layout>} />
                  <Route path="/blog" element={<Layout><BlogList /></Layout>} />
                  <Route path="/blog/:id" element={<Layout><BlogPost /></Layout>} />
                  <Route path="/contact" element={<Layout><Contact /></Layout>} />
                  <Route path="/login" element={<Layout><Login /></Layout>} />
                  <Route path="/register" element={<Layout><Register /></Layout>} />
                  <Route path="/contul-meu" element={<Layout><Account /></Layout>} />
                  <Route path="/cos" element={<Layout><Cart /></Layout>} />
                  <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
                  <Route path="/termeni" element={<Layout><Terms /></Layout>} />
                  <Route path="/siguranta-datelor" element={<Layout><DataSecurity /></Layout>} />
                  <Route path="/confidentialitate" element={<Layout><ConfidentialityPage /></Layout>} />
                  <Route path="/anulare" element={<Layout><RefundPolicy /></Layout>} />
                  <Route path="/livrare" element={<Layout><DeliveryPolicy /></Layout>} />
                  <Route path="/comercializare" element={<Layout><CommercePolicy /></Layout>} />
                  <Route path="/devino-livrator" element={<Layout><DriverApplication /></Layout>} />

                  {/* Guest Portal (Public, No Layout) */}
                  <Route path="/portal/:token" element={<GuestPortal />} />
                  <Route path="/rezervare/:token" element={<ReservationPage />} />

                  {/* Admin Routes (No Standard Layout or Custom Layout) */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedAdminRoute>
                        <AdminDashboard />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/events"
                    element={
                      <ProtectedAdminRoute>
                        <AdminEvents />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/events/:id"
                    element={
                      <ProtectedAdminRoute>
                        <AdminEventDetail />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/pos"
                    element={
                      <ProtectedAdminRoute>
                        <AdminPOS />
                      </ProtectedAdminRoute>
                    }
                  />

                  {/* Driver Routes */}
                  <Route path="/driver/login" element={<DriverLogin />} />
                  <Route path="/driver/dashboard" element={<DriverDashboard />} />
                </Routes>
              </Router>
            </BlogProvider>
          </CartProvider>
        </OrderProvider>
      </MenuProvider>
    </AuthProvider>
  );
}

export default App;
