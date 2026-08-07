import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  adminLogin,
  adminLogout,
  restoreSession,
  onSessionExpired,
} from '../services/api';

const AdminAuthContext = createContext(null);

// Admin auth now runs entirely on the Django backend (JWT access +
// refresh tokens via src/services/api.js) — no Firebase involved. See
// MIGRATION.md. `user` here is the { username, email, is_staff } shape
// returned by GET /api/auth/me/, not a Firebase user object.
export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-login after a page refresh: if a refresh token is still stored
  // and still valid, restoreSession() silently exchanges it for a fresh
  // access token and confirms who it belongs to.
  useEffect(() => {
    let cancelled = false;
    restoreSession().then((admin) => {
      if (!cancelled) {
        setUser(admin);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A 401 anywhere in the app (not just clicking "Sign out") means the
  // refresh token is dead — clear local state so ProtectedRoute sends
  // the admin back to the login page instead of showing a broken screen.
  useEffect(() => {
    return onSessionExpired(() => setUser(null));
  }, []);

  const signIn = useCallback(async (username, password) => {
    const data = await adminLogin(username, password);
    const admin = { username: data.username, is_staff: data.is_staff };
    setUser(admin);
    return admin;
  }, []);

  const signOut = useCallback(() => {
    adminLogout();
    setUser(null);
  }, []);

  const isAdmin = Boolean(user?.is_staff);

  return (
    <AdminAuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
