

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export async function fetchProducts() {
  const res = await fetch(`${API_BASE_URL}/api/products`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function registerUser(username: string, email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password })
  });
  return res.json();
}
