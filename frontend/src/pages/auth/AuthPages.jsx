import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Store, Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export const Login = () => {
  // `authError` carries cross-page session messages (e.g. "your session has
  // expired") set by AuthContext when the backend rejected the stored JWT.
  const { login, authLoading, authError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'seller' ? 'seller' : 'customer';
  const nextPath = searchParams.get('next');
  const isDev = import.meta.env.DEV;
  
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [email, setEmail] = useState(
    isDev ? (initialRole === 'seller' ? 'seller@neardeal.com' : 'customer@neardeal.com') : ''
  );
  // Demo accounts use password123 — prefilled so the login card works
  // straight out of the box in development.
  const [password, setPassword] = useState(isDev ? 'password123' : '');
  const [error, setError] = useState('');

  const handleRoleToggle = (role) => {
    setSelectedRole(role);
    setEmail(isDev ? (role === 'seller' ? 'seller@neardeal.com' : 'customer@neardeal.com') : '');
    setPassword(isDev ? 'password123' : '');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    setError('');
    try {
      await login(selectedRole, email, password);
      const defaultTarget = selectedRole === 'seller' ? '/seller' : '/';
      const isAdminTarget = nextPath === '/admin' || (nextPath || '').startsWith('/admin/');
      const target =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') && !isAdminTarget
          ? nextPath
          : defaultTarget;
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-page container flex items-center justify-center">
      <Card padding="lg" className="auth-card">
        <div className="auth-brand text-center mb-6">
          <div className="auth-icon-circle mx-auto mb-2">
            {selectedRole === 'seller' ? (
              <Store size={24} className="text-accent" />
            ) : (
              <ShoppingBag size={24} className="text-accent" />
            )}
          </div>
          <h1 className="text-xl font-bold">
            {selectedRole === 'seller' ? 'Seller Portal Login' : 'Customer Sign In'}
          </h1>
          <p className="text-xs text-muted">
            {selectedRole === 'seller'
              ? 'Access your neighborhood shop inventory & bargain queue'
              : 'Log in to discover local shops and negotiate real deals'}
          </p>
        </div>

        {/* Demo credentials hint — visible only when pre-filled email is unchanged and in DEV mode */}
        {isDev && (email === 'customer@neardeal.com' || email === 'seller@neardeal.com') && !error && !authError && (
          <div className="auth-demo-hint flex items-start gap-2 mb-3 p-2 rounded text-xs">
            <ShieldCheck size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <span>
              <strong>Demo account</strong> · email pre-filled · password:{' '}
              <code className="auth-demo-code">password123</code>
            </span>
          </div>
        )}

        {(error || authError) && (
          <div className="auth-error-banner flex items-center gap-2 mb-4 p-2 bg-danger-light text-danger rounded text-xs">
            <AlertCircle size={15} /> {error || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form flex flex-col gap-4">
          <div className="role-selector-group">
            <label className="input-label mb-1 block text-xs font-semibold">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleToggle('customer')}
                className={`auth-role-btn ${selectedRole === 'customer' ? 'active' : ''}`}
              >
                Customer Account
              </button>
              <button
                type="button"
                onClick={() => handleRoleToggle('seller')}
                className={`auth-role-btn ${selectedRole === 'seller' ? 'active' : ''}`}
              >
                Merchant / Seller
              </button>
            </div>
          </div>

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            variant="primary"
            size="lg"
            type="submit"
            className="w-full mt-2"
            icon={authLoading ? Loader2 : ArrowRight}
            disabled={authLoading}
          >
            {authLoading ? 'Signing in...' : `Log In as ${selectedRole === 'seller' ? 'Merchant' : 'Customer'}`}
          </Button>

          <p className="text-center text-xs text-muted mt-3">
            Don't have an account?{' '}
            <Link
              to={`/register?role=${selectedRole}`}
              className="text-accent font-semibold hover:underline"
            >
              Register here
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};

export const Register = () => {
  const { register, authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'seller' ? 'seller' : 'customer';
  const [role, setRole] = useState(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(role, {
        name: fullName,
        email: email,
        password: password,
        storeName: role === 'seller' ? `${fullName}'s Store` : undefined
      });
      if (role === 'seller') navigate('/seller');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-page container flex items-center justify-center">
      <Card padding="lg" className="auth-card">
        <div className="auth-brand text-center mb-6">
          <div className="auth-icon-circle mx-auto mb-2">
            <Store size={24} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold">Join the Local Marketplace</h1>
          <p className="text-xs text-muted">
            {role === 'seller'
              ? 'Onboard your local store and start taking smart bargain offers'
              : 'Create an account to start shopping and bargaining locally'}
          </p>
        </div>

        {error && (
          <div className="auth-error-banner flex items-center gap-2 mb-4 p-2 bg-danger-light text-danger rounded text-xs">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form flex flex-col gap-4">
          <div className="role-selector-group">
            <label className="input-label mb-1 block text-xs font-semibold">I want to register as:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`auth-role-btn ${role === 'customer' ? 'active' : ''}`}
              >
                Customer / Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`auth-role-btn ${role === 'seller' ? 'active' : ''}`}
              >
                Local Merchant
              </button>
            </div>
          </div>

          <Input
            label={role === 'seller' ? 'Merchant / Business Name' : 'Full Name'}
            icon={User}
            placeholder={role === 'seller' ? 'e.g. Sharma Hardware' : 'e.g. Aarav Mehta'}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Create Password"
            type="password"
            icon={Lock}
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {role === 'seller' && (
            <div className="seller-fee-disclaimer p-2.5 bg-muted rounded text-xs text-muted flex items-start gap-2">
              <ShieldCheck size={16} className="text-accent mt-0.5 flex-shrink-0" />
              <span>
                Merchant Policy: 2% platform fee applies strictly upon successful customer purchases. No upfront listing fees.
              </span>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            type="submit"
            className="w-full mt-2"
            icon={authLoading ? Loader2 : ArrowRight}
            disabled={authLoading}
          >
            {authLoading ? 'Registering...' : 'Complete Registration'}
          </Button>

          <p className="text-center text-xs text-muted mt-3">
            Already have an account?{' '}
            <Link to={`/login?role=${role}`} className="text-accent font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};

export const AdminLogin = () => {
  const { login, authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next');
  const [email, setEmail] = useState('admin@neardeal.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Admin authentication goes through the real backend only — no bypass.
    try {
      await login('admin', email, password);
      const target =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
          ? nextPath
          : '/admin';
      navigate(target, { replace: true });
    } catch (err) {
      // Backend rejected the credentials (e.g. no ADMIN account exists yet).
      // Never navigate to /admin without a token: ProtectedRoute would just
      // bounce the visitor back here, making it look like login does nothing.
      setError(err.message || 'Invalid admin credentials.');
    }
  };

  return (
    <div className="auth-page container flex items-center justify-center">
      <Card padding="lg" className="auth-card admin-auth-card">
        <div className="auth-brand text-center mb-6">
          <div className="auth-icon-circle mx-auto mb-2" style={{ background: 'var(--secondary-light)' }}>
            <ShieldCheck size={24} style={{ color: 'var(--secondary)' }} />
          </div>
          <h1 className="text-xl font-bold">Platform Governance Portal</h1>
          <p className="text-xs text-muted">Administrative Access & Platform Oversight</p>
        </div>

        {error && (
          <div className="auth-error-banner flex items-center gap-2 mb-4 p-2 bg-danger-light text-danger rounded text-xs">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form flex flex-col gap-4">
          <Input
            label="Admin Email"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            required
          />

          <Input
            label="Admin Password"
            type="password"
            icon={Lock}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            required
          />

          <Button
            variant="secondary"
            size="lg"
            type="submit"
            className="w-full mt-2"
            icon={authLoading ? Loader2 : ArrowRight}
            disabled={authLoading}
          >
            {authLoading ? 'Authenticating...' : 'Authenticate Administrative Access'}
          </Button>

          <p className="text-center text-xs text-muted mt-3">
            <Link to="/" className="text-muted hover:underline">
              Return to Public Marketplace
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};
