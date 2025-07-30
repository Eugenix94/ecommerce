import { useState } from 'react';

type User = {
  id: number;
  username: string;
  email: string;
} | null;

type TopBarProps = {
  user: User;
  onLogout: () => void;
};
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import AccountSettings from './AccountSettings';
import ProductsList from './ProductsList';
import Cart from './Cart';
import Orders from './Orders';
import './App.css';

type TopBarFullProps = TopBarProps & { onAccount: () => void };
function TopBar({ user, onLogout, onAccount }: TopBarFullProps) {
  return (
    <div className="top-bar">
      <span className="logo">EcoShop</span>
      <div className="topbar-actions">
        {user && <button onClick={onAccount} className="nav-btn">Account</button>}
        {user ? (
          <span className="user-info">
            <span className="user-icon" role="img" aria-label="user">👤</span>
            {user.username}
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </span>
        ) : null}
      </div>
    </div>
  );
}



export default function App() {
  const [page, setPage] = useState<string>('products');
  const [user, setUser] = useState<User>(null);
  const [cart, setCart] = useState<any[]>([]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setPage('account');
  };
  const handleLogout = () => {
    setUser(null);
    setPage('login');
    setCart([]);
  };
  const handleAddToCart = (product: any) => {
    setCart(prev => {
      const found = prev.find(item => item.id === product.id);
      if (found) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setPage('cart');
  };
  const handleRemoveFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };
  const handleCheckout = () => {
    setCart([]);
    setPage('products');
  };
  const handleAccount = () => {
    setPage('account');
  };
  const handleSettings = () => {
    setPage('settings');
  };

  return (
    <div className="container">
      <TopBar user={user} onLogout={handleLogout} onAccount={handleAccount} />
      <nav className="nav-bar">
        <button onClick={() => setPage('products')}>Products</button>
        <button onClick={() => setPage('cart')}>Cart</button>
        {!user && <button onClick={() => setPage('login')}>Login</button>}
        {!user && <button onClick={() => setPage('register')}>Register</button>}
        {user && <button onClick={() => setPage('orders')}>Orders</button>}
      </nav>
      <main>
        {page === 'products' && <ProductsList onAddToCart={handleAddToCart} user={user} />}
        {page === 'cart' && <Cart cart={cart} onCheckout={handleCheckout} onRemove={handleRemoveFromCart} user={user} />}
        {page === 'login' && <LoginForm onLogin={handleLogin} />}
        {page === 'register' && <RegisterForm />}
        {page === 'account' && user && (
          <div className="account-details">
            <h2>Account Details</h2>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <button onClick={handleSettings} className="nav-btn">Settings</button>
          </div>
        )}
        {page === 'orders' && user && <Orders user={user} />}
        {page === 'settings' && user && (
          <AccountSettings
            user={user}
            onUsernameUpdate={newUsername => setUser(user ? { ...user, username: newUsername } : user)}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}
