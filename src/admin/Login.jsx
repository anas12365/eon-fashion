import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLogin() {
  const { user, isAdmin, loading, signIn } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user && isAdmin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(username, password);
      // The Django login endpoint (AdminTokenObtainPairSerializer) already
      // refuses to issue a token to anyone who isn't staff, so a
      // successful signIn() here always means an authorized admin —
      // nothing further to check.
    } catch {
      setError('Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0D] px-6">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl text-white">EON</p>
        <p className="mt-1 text-xs tracking-[0.2em] text-white/40">ADMIN LOGIN</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs tracking-[0.15em] text-white/40">USERNAME</label>
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full border-b border-white/20 bg-transparent py-2.5 text-white outline-none focus:border-white"
            />
          </div>
          <div>
            <label className="text-xs tracking-[0.15em] text-white/40">PASSWORD</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border-b border-white/20 bg-transparent py-2.5 text-white outline-none focus:border-white"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-white py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
