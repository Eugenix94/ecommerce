import { API_BASE_URL } from './api';
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

  const [showPayment, setShowPayment] = useState(false);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');

  const handleCheckoutClick = () => {
    if (!user) {
      setMsg('Please log in to checkout.');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
  const res = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user?.id,
          items: cart,
          address,
          paymentMethod,
          deliveryMethod
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Checkout successful!');
        setShowPayment(false);
        setAddress('');
        setPaymentMethod('credit_card');
        setDeliveryMethod('standard');
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
      {cart.length > 0 && !showPayment && <button onClick={handleCheckoutClick}>Checkout</button>}
      {showPayment && (
        <form onSubmit={handlePaymentSubmit} className="payment-form">
          <h3>Payment & Delivery</h3>
          <label>
            Address:
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} required />
          </label>
          <label>
            Payment Method:
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="credit_card">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="cash">Cash</option>
            </select>
          </label>
          <label>
            Delivery Method:
            <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}>
              <option value="standard">Standard</option>
              <option value="express">Express</option>
            </select>
          </label>
          <button type="submit">Confirm & Pay</button>
          <button type="button" onClick={() => setShowPayment(false)}>Cancel</button>
        </form>
      )}
      {msg && <p className="cart-msg">{msg}</p>}
    </div>
  );
}
