import React from 'react';

const productNames: { [key: number]: string } = {
  1: 'Eco-Friendly Water Bottle',
  2: 'Wireless Headphones',
  3: 'Standing Desk'
};

export default function OrderDetails({ order, onModify }: any) {
  return (
    <div className="order-details">
      <h3>Order Details #{order.id}</h3>
      <h4>Items</h4>
      {order.items && order.items.length > 0 ? (
        <ul>
          {order.items.map((item: any) => (
            <li key={item.id}>
              {productNames[item.product_id] || `Product #${item.product_id}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>No items in this order.</p>
      )}
      <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
      <p><strong>Total Cost:</strong> ${order.total}</p>
      <p><strong>Payment Method:</strong> {order.payment_method}</p>
      <p><strong>Address:</strong> {order.address}</p>
      <p><strong>Delivery Method:</strong> {order.delivery_method}</p>
      <p><strong>Status:</strong> {order.order_status || 'pending'}</p>
      <button onClick={onModify}>Modify</button>
    </div>
  );
}
