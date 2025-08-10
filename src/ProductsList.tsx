import { API_BASE_URL } from './api';
import { useEffect, useState } from 'react';
import ProductDetails from './ProductDetails';
import { productImage } from './imagePlaceholders';

type ProductsListProps = {
  onAddToCart: (product: any) => void;
  user: any;
};

export default function ProductsList({ onAddToCart, user }: ProductsListProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'price' | 'alpha' | 'none'>('none');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
  fetch(`${API_BASE_URL}/api/products`, { credentials: 'include' })
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

  let filtered = [...products];
  if (filter === 'price') filtered.sort((a, b) => a.price - b.price);
  if (filter === 'alpha') filtered.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="products-list">
      <h2>Products</h2>
      <div className="product-filters">
        <label>Sort by: </label>
  <select aria-label="Sort products" value={filter} onChange={e => setFilter(e.target.value as any)}>
          <option value="none">None</option>
          <option value="price">Price</option>
          <option value="alpha">Alphabetical</option>
        </select>
      </div>
      <ul>
            {filtered.map((p) => (
              <li key={p.id}>
                <img
                  src={productImage(p)}
                  alt={p.name}
                  width={80}
                  height={54}
                  loading="lazy"
                  className="product-thumb"
                  onClick={() => setSelectedProduct(p)}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = productImage({ category: p.category }); }}
                />
            <div>
              <strong className="clickable-name" onClick={() => setSelectedProduct(p)}>{p.name}</strong> (${p.price})<br />
              <span>{p.description}</span><br />
              <span>Category: {p.category}</span><br />
              <span>Stock: {p.stock}</span><br />
              {user && <button onClick={() => onAddToCart(p)}>Add to Cart</button>}
            </div>
          </li>
        ))}
      </ul>
  {selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={onAddToCart} />}
    </div>
  );
}
