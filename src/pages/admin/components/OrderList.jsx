import React from 'react';
import OrderCard from './OrderCard';
import { useOrder } from '../../../context/OrderContext';
import { Check, X } from 'lucide-react';

const OrderList = () => {
    const { getOrdersByStatus, updateOrderStatus } = useOrder();
    const pendingOrders = getOrdersByStatus('pending');

    const handleConfirm = (orderId) => {
        updateOrderStatus(orderId, 'preparing');
    };

    const handleCancel = (orderId) => {
        if (window.confirm('Ești sigur că vrei să anulezi această comandă?')) {
            updateOrderStatus(orderId, 'cancelled');
        }
    };

    if (pendingOrders.length === 0) {
        return <div className="p-4 text-center text-gray-500">Nu există comenzi noi în așteptare.</div>;
    }

    return (
        <div className="order-list-container" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span style={{ background: '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>{pendingOrders.length}</span>
                Comenzi Noi
            </h3>

            {pendingOrders.map(order => (
                <div key={order.id} style={{
                    marginBottom: '2rem',
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px -4px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    border: '1px solid #f1f5f9'
                }}>
                    {/* Header Banner - Optional visual cue */}
                    <div style={{ height: '6px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}></div>

                    {/* Content */}
                    <div style={{ padding: '0' }}>
                        <OrderCard order={order} />
                    </div>

                    {/* Action Footer */}
                    <div style={{
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        gap: '1rem'
                    }}>
                        <button
                            onClick={() => handleConfirm(order.id)}
                            className="btn-confirm-premium"
                            style={{
                                flex: 2,
                                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '1rem',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '50%' }}>
                                <Check size={20} color="white" strokeWidth={3} />
                            </div>
                            CONFIRMĂ COMANDA
                        </button>

                        <button
                            onClick={() => handleCancel(order.id)}
                            style={{
                                flex: 1,
                                background: 'white',
                                color: '#ef4444',
                                border: '2px solid #fee2e2',
                                padding: '1rem',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.background = '#fef2f2';
                                e.currentTarget.style.borderColor = '#ef4444';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = '#fee2e2';
                            }}
                        >
                            <X size={20} /> Anulează
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OrderList;
