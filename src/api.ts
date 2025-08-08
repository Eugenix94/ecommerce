export async function fetchProducts() {
  const res = await fetch('http://localhost:3001/api/products', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function registerUser(username: string, email: string, password: string) {
  const res = await fetch('http://localhost:3001/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password })
  });
  return res.json();
}
