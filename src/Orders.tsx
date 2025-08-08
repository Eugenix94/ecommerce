import { useEffect, useState } from 'react';
import ModifyOrderForm from './ModifyOrderForm';
import Modal from './Modal';
import OrderDetails from './OrderDetails';

type User = {
  id: number;
  username: string;
  email: string;
};



interface OrdersProps {
  user: User;
}

export default function Orders({ user }: OrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
  fetch(`http://localhost:3001/api/orders/${user.id}`, { credentials: 'include' })
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
          {orders.map((order: any) => (
            <li key={order.id}>
              <button onClick={() => setDetailsOrderId(order.id)}>
                View Details (Order #{order.id} - {new Date(order.created_at).toLocaleDateString()})
              </button>
              {detailsOrderId === order.id && (
                <OrderDetails order={order} onModify={() => { setSelectedOrder(order); setModalOpen(true); }} />
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        {selectedOrder && (
          <ModifyOrderForm order={selectedOrder} onModified={async () => {
            setModalOpen(false);
            setLoading(true);
            const refreshed = await fetch(`http://localhost:3001/api/orders/${user.id}`, { credentials: 'include' });
            const data = await refreshed.json();
            setOrders(data);
            setLoading(false);
          }} onDeleted={async () => {
            setModalOpen(false);
            setLoading(true);
            const refreshed = await fetch(`http://localhost:3001/api/orders/${user.id}`, { credentials: 'include' });
            const data = await refreshed.json();
            setOrders(data);
            setLoading(false);
          }} />
        )}
      </Modal>
    </div>
  );
}
