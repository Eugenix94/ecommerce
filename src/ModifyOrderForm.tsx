import { useState } from 'react';

export default function ModifyOrderForm({ order, onModified, onDeleted }: any) {
  const [address, setAddress] = useState(order.address || '');
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method || '');
  const [deliveryMethod, setDeliveryMethod] = useState(order.delivery_method || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleModify(e: any) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!address || !paymentMethod || !deliveryMethod) {
        setError('All fields are required.');
        setLoading(false);
        return;
      }
      const res = await fetch(`http://localhost:3001/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          paymentMethod,
          deliveryMethod,
          items: order.items // keep items unchanged
        })
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Modify failed.');
      } else {
        setError('Order details updated successfully.');
        setTimeout(() => setError(''), 2000); // Clear success message after 2 seconds
        onModified();
      }
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this order?')) return;
    setLoading(true);
    setError('');
    try {
      // Use correct endpoint and check for valid order id
      if (!order.id) {
        setError('Order ID missing.');
        setLoading(false);
        return;
      }
      const res = await fetch(`http://localhost:3001/api/admin/orders/${order.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Delete failed.');
      } else {
        onDeleted();
      }
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  }

  return (
    <form className="modify-order-form" onSubmit={handleModify}>
      <h3>Modify Order #{order.id}</h3>
      <label>
        Address:
        <input value={address} onChange={e => setAddress(e.target.value)} />
      </label>
      <label>
        Payment Method:
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="">Select payment method</option>
          <option value="credit_card">Credit Card</option>
          <option value="paypal">PayPal</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </label>
      <label>
        Delivery Method:
        <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}>
          <option value="">Select delivery method</option>
          <option value="standard">Standard Shipping</option>
          <option value="express">Express Shipping</option>
          <option value="pickup">Store Pickup</option>
        </select>
      </label>
      <button type="submit" disabled={loading}>Save Changes</button>
      <button type="button" onClick={handleDelete} disabled={loading} style={{ marginLeft: '1em', color: 'red' }}>Delete Order</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
