import { useState } from 'react';

export default function RegisterForm() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    const res = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.error) setMsg(data.error);
    else setMsg('Registration successful!');
    setLoading(false);
  };

  return (
    <form className="register-form" onSubmit={handleRegister}>
      <label>
        Username
        <input name="username" value={form.username} onChange={handleChange} required />
      </label>
      <label>
        Email
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </label>
      <label>
        Password
        <input name="password" type="password" value={form.password} onChange={handleChange} required />
      </label>
      <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
      {msg && <p className="register-msg">{msg}</p>}
    </form>
  );
}
