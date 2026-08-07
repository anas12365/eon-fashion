import { lazy, Suspense, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Intro from './components/Intro';
import ProtectedRoute from './admin/ProtectedRoute';
import AdminLayout from './admin/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';

// Route-level code splitting: each page is only fetched when a visitor
// actually navigates to it, instead of every page (storefront + the
// entire admin dashboard) living in one upfront bundle. AdminLayout,
// ProtectedRoute, Navbar/Footer/CartDrawer/Intro stay as regular static
// imports — they're shell/layout pieces needed immediately, not routed
// pages, so splitting them out would just add an extra network round
// trip for no bundle-size benefit.
const Home = lazy(() => import('./pages/Home'));
const Collection = lazy(() => import('./pages/Collection'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const About = lazy(() => import('./pages/About'));
const SizeGuide = lazy(() => import('./pages/SizeGuide'));
const Contact = lazy(() => import('./pages/Contact'));
const Cart = lazy(() => import('./pages/Cart'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));

const AdminLogin = lazy(() => import('./admin/Login'));
const AdminDashboard = lazy(() => import('./admin/Dashboard'));
const AdminProducts = lazy(() => import('./admin/Products'));
const AdminInventory = lazy(() => import('./admin/Inventory'));
const AdminOrders = lazy(() => import('./admin/Orders'));
const AdminCategories = lazy(() => import('./admin/Categories'));
const AdminCustomers = lazy(() => import('./admin/Customers'));
const AdminReports = lazy(() => import('./admin/Reports'));

function PublicSite() {
  const [introDone, setIntroDone] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const location = useLocation();

  const handleIntroDone = (wasShown) => {
    setShowIntro(false);
    setIntroDone(true);
  };

  return (
    <>
      {showIntro && <Intro onDone={handleIntroDone} />}

      <div className={introDone || !showIntro ? '' : 'invisible'}>
        <Navbar />
        <CartDrawer />
        <main className="min-h-screen">
          {/* Section-level boundary: an error in one page (e.g. a bad
              product record on ProductDetail) shows a contained message
              here instead of taking the Navbar/CartDrawer/Footer down
              with it. Keyed by pathname so it clears itself on navigation
              rather than staying tripped after the user has moved on. */}
          <ErrorBoundary variant="section" label="page" resetKey={location.pathname}>
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Home />} />
                  <Route path="/collection" element={<Collection />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/size-guide" element={<SizeGuide />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Suspense fallback={<PageLoader variant="admin" />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="categories" element={<AdminCategories />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  return <PublicSite />;
}
