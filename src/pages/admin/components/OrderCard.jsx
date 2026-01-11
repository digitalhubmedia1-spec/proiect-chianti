import React from 'react';
import { Phone, Clock, MapPin, Utensils, User, Check, Users } from 'lucide-react';

const OrderCard = ({ order, showActions = false, onConfirm }) => {
    const deliveryMethod = order.customer.deliveryMethod;
    const isDelivery = deliveryMethod === 'delivery' || deliveryMethod === 'event-location';
    const isCatering = order.isCatering || deliveryMethod.startsWith('event-');

    let methodLabel = 'Livrare la Domiciliu';
    let methodIcon = <MapPin size={16} style={{ color: '#dc2626' }} />;
    let methodColor = '#dc2626';

    if (deliveryMethod === 'pickup') {
        methodLabel = 'Ridicare Personală';
        methodIcon = <Utensils size={16} style={{ color: '#ea580c' }} />;
        methodColor = '#ea580c';
    } else if (deliveryMethod === 'dinein') {
        methodLabel = 'Servire în Restaurant';
        methodIcon = <Utensils size={16} style={{ color: '#ea580c' }} />;
        methodColor = '#ea580c';
    } else if (deliveryMethod === 'event-restaurant') {
        methodLabel = 'Eveniment la Restaurant';
        methodIcon = <Users size={16} style={{ color: '#7c3aed' }} />;
        methodColor = '#7c3aed';
    } else if (deliveryMethod === 'event-location') {
        methodLabel = 'Eveniment la Locație';
        methodIcon = <MapPin size={16} style={{ color: '#7c3aed' }} />;
        methodColor = '#7c3aed';
    }

    return (
        <div className="order-card-inner" style={{
            background: 'white',
            padding: '1.5rem', // increased padding
            // Box shadow and radius removed as they are handled by parent in premium view
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '1.1rem' }}>#{order.id.slice(-6)}</span>
                    {isCatering && (
                        <span style={{
                            background: '#f3e8ff',
                            color: '#7c3aed',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                        }}>Catering</span>
                    )}
                </div>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                    {order.date && !isNaN(new Date(order.date)) ? new Date(order.date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <User size={18} style={{ color: '#0f172a', marginTop: '2px' }} />
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', lineHeight: '1.2' }}>
                            {order.customer.firstName} {order.customer.lastName}
                        </div>
                        {order.customer.companyName && (
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                                {order.customer.companyName}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Phone size={16} style={{ color: '#059669' }} />
                    <a href={`tel:${order.customer.phone}`} style={{ color: '#0f172a', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500' }}>
                        {order.customer.phone}
                    </a>
                </div>
            </div>

            <div style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                marginBottom: '1rem',
                border: '1px solid #e2e8f0'
            }}>
                {order.items && order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#334155' }}>
                        <span><span style={{ fontWeight: '700' }}>{item.quantity}x</span> {item.name}</span>
                        <span>{(item.price * item.quantity).toFixed(2)} Lei</span>
                    </div>
                ))}
                {/* Show Delivery Cost Line if exists */}
                {order.deliveryCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b', fontStyle: 'italic' }}>
                        <span>Transport ({order.customer.city})</span>
                        <span>{order.deliveryCost.toFixed(2)} Lei</span>
                    </div>
                )}
                <div style={{
                    borderTop: '1px solid #e2e8f0',
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    fontWeight: '800',
                    textAlign: 'right',
                    color: '#0f172a',
                    fontSize: '1.1rem'
                }}>
                    Total: {(order.finalTotal || order.total)?.toFixed(2)} Lei
                </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Delivery Method Label */}
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        {methodIcon}
                        <span style={{ fontWeight: '600', color: methodColor }}>{methodLabel}</span>
                    </div>

                    {/* Address if relevant */}
                    {isDelivery && (
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginLeft: '1.6rem' }}>
                            <span style={{ lineHeight: '1.4' }}>
                                {order.customer.address}, {order.customer.neighborhood} {order.customer.city !== 'Roman' ? `(${order.customer.city})` : ''}
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        <Clock size={16} style={{ color: '#2563eb' }} />
                        <span style={{ fontWeight: '500' }}>Ora: {order.customer.deliveryTime}</span>
                    </div>
                </div>

                {order.customer.details && (
                    <div style={{
                        marginTop: '0.75rem',
                        fontStyle: 'italic',
                        color: '#64748b',
                        padding: '0.5rem 0.75rem',
                        background: '#fff',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.85rem'
                    }}>
                        "{order.customer.details}"
                    </div>
                )}
            </div>

            {showActions && (
                <button
                    onClick={() => onConfirm(order.id)}
                    className="btn"
                    style={{
                        width: '100%',
                        background: '#16a34a',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginTop: '1rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)'
                    }}
                >
                    <Check size={18} /> Confirmă Comanda
                </button>
            )}
        </div>
    );
};

export default OrderCard;
