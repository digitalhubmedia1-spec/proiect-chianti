import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import './Account.css';

const Account = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();

    const { orders } = useOrder();

    if (loading) {
        return <div className="loading-spinner">Se încarcă profilul...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    // Filter orders by current user's email
    // Note: In a real app we'd query API by userID, but here we filter the global context state
    const userOrders = orders.filter(o => o.customer.email === user.email).sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="account-page">
            <div className="container">
                <div className="account-header">
                    <h1>Bine ai venit, {user.user_metadata?.full_name || user.email}!</h1>
                    <button onClick={handleLogout} className="btn btn-outline-dark">Deconectare</button>
                </div>

                <div className="account-grid">
                    <div className="account-card profile-card">
                        <h3>Detaliile Tale</h3>
                        <div className="profile-info">
                            <p><strong>Nume:</strong> {user.user_metadata?.full_name || 'Nespecificat'}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Telefon:</strong> {user.user_metadata?.phone || user.phone || 'Nespecificat'}</p>
                        </div>
                    </div>

                    <div className="account-card orders-card">
                        <h3>Istoric Comenzi</h3>
                        {userOrders.length === 0 ? (
                            <p className="empty-state">Nu ai plasat nicio comandă recentă.</p>
                        ) : (
                            <div className="orders-list">
                                {userOrders.map(order => (
                                    <div key={order.id} className="history-order-item" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold' }}>#{order.id.slice(-6)}</span>
                                            <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                                {new Date(order.created_at || order.date).toLocaleDateString('ro-RO')} {new Date(order.created_at || order.date).toLocaleTimeString('ro-RO')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold',
                                                        background:
                                                            order.status === 'pending' ? '#fff3cd' :
                                                                order.status === 'preparing' ? '#cce5ff' :
                                                                    order.status === 'delivering' ? '#d4edda' :
                                                                        order.status === 'completed' ? '#d1e7dd' : '#f8d7da',
                                                        color:
                                                            order.status === 'pending' ? '#856404' :
                                                                order.status === 'preparing' ? '#004085' :
                                                                    order.status === 'delivering' ? '#155724' :
                                                                        order.status === 'completed' ? '#0f5132' : '#721c24'
                                                    }}
                                                >
                                                    {order.status === 'pending' ? 'În Așteptare' :
                                                        order.status === 'preparing' ? 'În Preparare' :
                                                            order.status === 'delivering' ? 'Livrare/Ridicare' :
                                                                order.status === 'completed' ? 'Finalizată' : 'Anulată'}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 'bold' }}>{order.total.toFixed(2)} Lei</div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.5rem' }}>
                                            {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;
