import { useState } from 'react';

type LoginFormProps = {
  onLogin?: (user: { id: number; username: string; email: string }) => void;
};

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    const res = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.error) setMsg(data.error);
    else {
      setMsg('Login successful!');
      if (onLogin && data.user) onLogin(data.user);
    }
    setLoading(false);
  };

  return (
    <form className="login-form" onSubmit={handleLogin}>
      <label>
        Username
  <input name="username" placeholder="Enter your username" value={form.username} onChange={handleChange} required />
      </label>
      <label>
        Password
  <input name="password" type="password" placeholder="Enter your password" value={form.password} onChange={handleChange} required />
      </label>
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      {msg && <p className="login-msg">{msg}</p>}
    </form>
  );
}
