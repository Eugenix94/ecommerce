import { useEffect, useState } from 'react';

type User = {
  id: number;
  username: string;
  email: string;
};

type OrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  created_at: string;
  total: number;
  items: OrderItem[];
};

interface OrdersProps {
  user: User;
}

export default function Orders({ user }: OrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetch(`http://localhost:3001/api/orders/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load orders');
        setLoading(false);
      });
  }, [user]);

  if (!user) return <p>Please log in to view your orders.</p>;
  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="orders-section">
      <h2>Your Orders</h2>
      {orders.length === 0 ? <p>No orders found.</p> : (
        <ul>
          {orders.map((order: Order) => (
            <li key={order.id}>
              <strong>Order #{order.id}</strong> - {new Date(order.created_at).toLocaleString()}<br />
              <strong>Total:</strong> ${order.total}<br />
              <ul>
                {order.items.map((item: OrderItem) => (
                  <li key={item.id}>
                    {item.quantity} x Product #{item.product_id} @ ${item.price}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
