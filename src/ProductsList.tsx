import { useEffect, useState } from 'react';

type ProductsListProps = {
  onAddToCart: (product: any) => void;
  user: any;
};

export default function ProductsList({ onAddToCart, user }: ProductsListProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load products');
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="products-list">
      <h2>Products</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            <img src={p.image} alt={p.name} width={80} />
            <div>
              <strong>{p.name}</strong> (${p.price})<br />
              <span>{p.description}</span><br />
              <span>Category: {p.category}</span><br />
              <span>Stock: {p.stock}</span><br />
              {user && <button onClick={() => onAddToCart(p)}>Add to Cart</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
