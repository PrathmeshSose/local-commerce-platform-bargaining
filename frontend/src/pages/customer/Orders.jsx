import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState, Loader } from '../../components/common/Loader';
import { Package, MapPin, Store } from 'lucide-react';
import { formatINR, formatDateIN } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import './Orders.css';

export const Orders = () => {
  // Order history as MongoDB returns it — shared AuthContext state (no demo orders)
  const { orders, ordersLoading, ordersError } = useAuth();

  return (
    <div className="orders-page container mt-6">
      <div className="orders-header mb-6">
        <h1 className="text-2xl font-bold">Your Orders & Store Pickups</h1>
        <p className="text-sm text-muted">Track purchases and pickup statuses across neighborhood stores</p>
      </div>

      {ordersLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader size="lg" message="Loading your orders..." />
        </div>
      ) : ordersError ? (
        <p className="text-sm text-danger" role="alert">{ordersError}</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          message="Orders you complete at checkout will appear here with their pickup details and status."
          action={
            <Link to="/products">
              <Button variant="primary" size="md">
                Start Shopping
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="orders-list flex flex-col gap-4">
          {orders.map((order) => (
            <Card key={order.id} padding="md" className="order-card">
              <div className="order-top-bar flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="order-icon-wrap">
                    <Package size={20} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm">Order #{order.orderNumber || order.id}</h2>
                    <span className="text-xs text-muted">Ordered on {formatDateIN(order.date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      order.statusLabel === 'Completed' || order.statusLabel === 'Delivered'
                        ? 'success'
                        : order.statusLabel === 'Cancelled'
                          ? 'danger'
                          : 'info'
                    }
                    size="sm"
                  >
                    {order.statusLabel || order.status}
                  </Badge>
                  <span className="text-xs text-muted font-medium">{order.paymentStatus}</span>
                </div>
              </div>

              <div className="order-details-content mt-3 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted mb-2">
                    <Store size={14} /> Seller: <strong>{order.sellerName}</strong>
                  </div>

                  <div className="order-items-stack flex flex-col gap-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-xs bg-muted px-1.5 py-0.5 rounded">
                          {item.quantity}x
                        </span>
                        <span>{item.title}</span>
                        <span className="font-semibold">{formatINR(item.unitPrice * item.quantity)}</span>
                        {item.negotiated && (
                          <Badge variant="bargain" size="sm">Smart Offer Won</Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-accent mt-3">
                    <MapPin size={14} /> {order.fulfillmentType}
                  </div>
                </div>

                <div className="order-total-block text-right">
                  <span className="text-xs text-muted block">Total Paid by Customer</span>
                  <span className="text-xl font-bold text-main">{formatINR(order.totalAmount)}</span>
                  <span className="text-xs text-muted block mt-1">
                    (Seller platform commission: {formatINR(order.platformCommission, true)})
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
