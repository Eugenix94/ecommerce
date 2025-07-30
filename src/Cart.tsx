import { useState } from 'react';

type CartProps = {
  cart: any[];
  onCheckout: () => void;
  onRemove: (id: number) => void;
  user?: { id: number; username: string; email: string } | null;
};

export default function Cart({ cart, onCheckout, onRemove, user }: CartProps) {
  const [msg, setMsg] = useState('');
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = async () => {
    setMsg('');
    if (!user) {
      setMsg('Please log in to checkout.');
      return;
    }
    try {
      const res = await fetch('http://localhost:3001/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          items: cart,
          address: 'Test Address',
          paymentMethod: 'credit_card',
          deliveryMethod: 'standard'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Checkout successful!');
        onCheckout();
      } else {
        setMsg(data.error || 'Checkout failed.');
      }
    } catch {
      setMsg('Checkout failed.');
    }
  };

  return (
    <div className="cart-section">
      <h2>Cart</h2>
      {cart.length === 0 ? <p>Your cart is empty.</p> : (
        <ul>
          {cart.map(item => (
            <li key={item.id}>
              <strong>{item.name}</strong> x {item.qty} (${item.price * item.qty})
              <button onClick={() => onRemove(item.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <p><strong>Total:</strong> ${total.toFixed(2)}</p>
      {cart.length > 0 && <button onClick={handleCheckout}>Checkout</button>}
      {msg && <p className="cart-msg">{msg}</p>}
    </div>
  );
}
