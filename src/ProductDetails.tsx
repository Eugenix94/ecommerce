// ...existing code...

export default function ProductDetails({ product, onClose, onAddToCart }: { product: any, onClose: () => void, onAddToCart: (product: any) => void }) {
  if (!product) return null;
  return (
    <div className="product-details-modal">
      <div className="product-details-card">
        <button className="close-btn" onClick={onClose}>×</button>
        <img src={product.image} alt={product.name} width={160} />
        <h2>{product.name}</h2>
        <p><strong>Price:</strong> ${product.price}</p>
        <p><strong>Description:</strong> {product.description}</p>
        <p><strong>Category:</strong> {product.category}</p>
        <p><strong>Stock:</strong> {product.stock}</p>
        <button className="add-to-cart-btn" onClick={() => { onAddToCart(product); onClose(); }}>Add to Cart</button>
        {product.features && <ul>
          {product.features.map((f: string, i: number) => <li key={i}>{f}</li>)}
        </ul>}
      </div>
      <div className="product-details-backdrop" onClick={onClose}></div>
    </div>
  );
}
