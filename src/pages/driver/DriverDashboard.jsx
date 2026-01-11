import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrder } from '../../context/OrderContext';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Phone, CheckCircle, Navigation, Clock, LogOut, Package } from 'lucide-react';

const DriverDashboard = () => {
    const { getDriverProfile, logout } = useAuth();
    const { getDriverOrders, updateOrderStatus, orders } = useOrder(); // getting all orders to trigger re-renders properly
    const navigate = useNavigate();
    const [driver, setDriver] = useState(null);
    const [myOrders, setMyOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('active'); // active, history

    useEffect(() => {
        const profile = getDriverProfile();
        if (!profile) {
            navigate('/driver/login');
            return;
        }
        setDriver(profile);
    }, [navigate, getDriverProfile]);

    useEffect(() => {
        if (driver) {
            // Recalculate orders whenever 'orders' context changes
            const userOrders = getDriverOrders(driver.id);
            setMyOrders(userOrders);
            // console.log("Driver orders updated:", userOrders);
        }
    }, [driver, orders, getDriverOrders]); // dependencies: orders from context

    const handleStatusUpdate = (orderId, newDriverStatus) => {
        // We need to update the global order object
        // Since we don't have a direct 'updateDriverStatus' function exposed (we only exposed updateOrderStatus and assignDriverToOrder),
        // we might need to rely on assignDriverToOrder to update the driver status field or updateOrderStatus if we map it.
        // Actually, in OrderContext we defined: assignDriverToOrder updates driverStatus to 'assigned'.
        // We need a way to update specifically driverStatus.
        // Let's implement a quick helper here or use updateOrderStatus if it supports merging.
        // Wait, I didn't add updateDriverStatus in context.
        // I should probably switch the order status to 'completed' when delivered.

        // Let's assume for now we use updateOrderStatus and maybe I should add a specific updateDriverStatus to context to be clean.
        // But to save time, let's treat "Plec spre client" as just a local UI state or if we want it persisted, we need to modify context.

        // Re-reading plan: "cand apasa pe plec spre client... clientul va primi un email (not now)..."
        // so it IS a state change.

        // FIX: I will use a direct modification on the orders list via a custom function if possible, or just hack it with updateOrderStatus if I modified it to accept extra data.
        // But `updateOrderStatus` only takes `newStatus`.

        // I will MODIFY the context in the next step to support `updateDriverStatus`.
        // For now, I'll write the calls assuming it exists: `updateDriverStatus(orderId, status)`.
    };

    const handleEnRoute = (orderId) => {
        // logic placeholder
    };

    const handleDelivered = (orderId) => {
        updateOrderStatus(orderId, 'completed');
    };

    const activeOrders = myOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const historyOrders = myOrders.filter(o => o.status === 'completed');

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px', fontFamily: '"Inter", sans-serif' }}>
            {/* Header */}
            <div style={{
                background: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        background: '#800020',
                        color: 'white',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px'
                    }}>
                        <Truck size={20} />
                    </div>
                    <div>
                        <h6 style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: '#1a1a1a' }}>Panou Livrator</h6>
                        <small style={{ color: '#64748b', fontSize: '0.85rem' }}>{driver?.name || 'Livrator'}</small>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); navigate('/driver/login'); }}
                    style={{
                        background: 'transparent',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <LogOut size={18} />
                </button>
            </div>

            <div className="container" style={{ padding: '1.5rem 1rem' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: activeTab === 'active' ? 'none' : '1px solid #e2e8f0',
                            backgroundColor: activeTab === 'active' ? '#800020' : 'white',
                            color: activeTab === 'active' ? 'white' : '#64748b',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: activeTab === 'active' ? '0 4px 12px rgba(128, 0, 32, 0.2)' : 'none',
                            transition: 'all 0.2s'
                        }}
                        onClick={() => setActiveTab('active')}
                    >
                        Active ({activeOrders.length})
                    </button>
                    <button
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: activeTab === 'history' ? 'none' : '1px solid #e2e8f0',
                            backgroundColor: activeTab === 'history' ? '#800020' : 'white',
                            color: activeTab === 'history' ? 'white' : '#64748b',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: activeTab === 'history' ? '0 4px 12px rgba(128, 0, 32, 0.2)' : 'none',
                            transition: 'all 0.2s'
                        }}
                        onClick={() => setActiveTab('history')}
                    >
                        Istoric
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'active' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activeOrders.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '4rem 2rem',
                                color: '#94a3b8',
                                background: 'white',
                                borderRadius: '16px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                border: '1px solid #f0f0f0'
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: '#f8fafc',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem'
                                }}>
                                    <Package size={36} style={{ color: '#cbd5e1' }} />
                                </div>
                                <h5 style={{ color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>Nicio comandă activă</h5>
                                <p style={{ fontSize: '0.9rem', margin: 0 }}>Vei fi notificat când apar comenzi noi.</p>
                            </div>
                        )}
                        {activeOrders.map(order => (
                            <ActiveOrderCard key={order.id} order={order} />
                        ))}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {historyOrders.map(order => (
                            <div key={order.id} style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '1.25rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                border: '1px solid #f0f0f0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: '700', color: '#334155' }}>#{order.id.slice(-6).toUpperCase()}</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {(order.isCatering || (order.customer.deliveryMethod || '').startsWith('event-')) && (
                                            <span style={{
                                                background: '#f3e8ff',
                                                color: '#7c3aed',
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: '700'
                                            }}>CATERING</span>
                                        )}
                                        <span style={{
                                            background: '#d1e7dd',
                                            color: '#0f5132',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700'
                                        }}>LIVRAT</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                                    <MapPin size={16} style={{ marginRight: '8px', marginTop: '2px', flexShrink: 0 }} />
                                    <span>
                                        {order.customer.deliveryMethod === 'event-restaurant' ? 'Eveniment la Restaurant (Chianti)' :
                                            order.customer
                                                ? `${order.customer.address}, ${order.customer.neighborhood || ''}, ${order.customer.city || ''}`
                                                : 'Adresa client...'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                                    <Clock size={16} style={{ marginRight: '8px', flexShrink: 0 }} />
                                    <span>{new Date(order.created_at || order.date).toLocaleDateString('ro-RO')}</span>
                                </div>
                                <div style={{
                                    paddingTop: '0.75rem',
                                    borderTop: '1px solid #f1f5f9',
                                    textAlign: 'right',
                                    fontWeight: '700',
                                    color: '#1e293b'
                                }}>
                                    Total: {(order.finalTotal || order.total)?.toFixed(2)} Lei
                                </div>
                            </div>
                        ))}
                        {historyOrders.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem',
                                color: '#94a3b8'
                            }}>
                                <p>Nu ai istoric de livrări.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const ActiveOrderCard = ({ order }) => {
    // We need to inject the context function to update driver status
    // Since I can't pass it easily without context update, I'll use a placeholder logic first
    // In a real app, I'd update the context first.

    // TEMPORARY: using useOrder hook inside here? Yes.
    const { updateOrderStatus, updateDriverStatus } = useOrder();

    const status = order.driverStatus || 'assigned'; // assigned, en_route

    const handleDepart = () => {
        if (updateDriverStatus) {
            updateDriverStatus(order.id, 'en_route');
        }
    };

    const handleComplete = () => {
        if (updateDriverStatus) updateDriverStatus(order.id, 'delivered');
        updateOrderStatus(order.id, 'completed');
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            overflow: 'hidden',
            marginBottom: '1rem'
        }}>
            <div style={{
                padding: '1rem 1.5rem',
                background: 'white',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>#{order.id.slice(-6).toUpperCase()}</span>
                    {(order.isCatering || (order.customer.deliveryMethod || '').startsWith('event-')) && (
                        <span style={{
                            background: '#f3e8ff',
                            color: '#7c3aed',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontSize: '0.65rem',
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}>CATERING</span>
                    )}
                </div>
                <span style={{
                    background: status === 'en_route' ? '#cff4fc' : '#fff3cd',
                    color: status === 'en_route' ? '#055160' : '#856404',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                }}>
                    {status === 'en_route' ? 'PE DRUM' : 'ASIGNATĂ'}
                </span>
            </div>
            <div style={{ padding: '1.5rem' }}>
                {/* Client Info */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h6 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1a1a1a' }}>
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Client Nume'}
                    </h6>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem', color: '#64748b', fontSize: '0.95rem' }}>
                        <MapPin size={18} style={{ marginRight: '10px', marginTop: '2px', color: '#dc3545', flexShrink: 0 }} />
                        <span style={{ lineHeight: '1.5' }}>
                            {order.customer.deliveryMethod === 'event-restaurant' ? (
                                <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>Eveniment la Restaurant (Chianti)</span>
                            ) : (
                                `${order.customer.address}, ${order.customer.neighborhood || ''}, ${order.customer.city || ''}`
                            )}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '0.95rem' }}>
                        <Phone size={18} style={{ marginRight: '10px', color: '#198754', flexShrink: 0 }} />
                        <a href={`tel:${order.customer?.phone}`} style={{ textDecoration: 'none', color: '#1e293b', fontWeight: '500' }}>
                            {order.customer?.phone || '07xx xxx xxx'}
                        </a>
                    </div>
                </div>

                {/* Items Summary */}
                <div style={{
                    background: '#f8fafc',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem'
                }}>
                    <div style={{ fontWeight: '700', marginBottom: '0.75rem', color: '#475569' }}>Produse ({order.items?.length || 0}):</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', color: '#334155' }}>
                        {(order.items || []).map((item, i) => (
                            <li key={i} style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '8px', color: '#94a3b8' }}>•</span>
                                <span><strong style={{ color: '#1e293b' }}>{item.count}x</strong> {item.name}</span>
                            </li>
                        ))}
                    </ul>
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', textAlign: 'right', fontWeight: '800', fontSize: '1.1rem', color: '#1a1a1a' }}>
                        Total: {(order.finalTotal || order.total)?.toFixed(2)} Lei (Cash)
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {status === 'assigned' && (
                        <button
                            onClick={handleDepart}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: '#0d6efd',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(13, 110, 253, 0.2)'
                            }}
                        >
                            <Navigation size={20} style={{ marginRight: '10px' }} />
                            Plec spre client
                        </button>
                    )}

                    {status === 'en_route' && (
                        <>
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.customer ? `${order.customer.address}, ${order.customer.neighborhood || ''}, ${order.customer.city || 'Roman'}` : 'Roman, Neamt')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: 'white',
                                    color: '#0d6efd',
                                    border: '2px solid #0d6efd',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <MapPin size={20} style={{ marginRight: '10px' }} /> Navigare GPS (Google Maps)
                            </a>
                            <button
                                onClick={handleComplete}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: '#198754',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(25, 135, 84, 0.2)'
                                }}
                            >
                                <CheckCircle size={22} style={{ marginRight: '10px' }} />
                                Livrare Finalizată
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DriverDashboard;
