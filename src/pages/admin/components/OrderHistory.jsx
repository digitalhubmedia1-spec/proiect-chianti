import React, { useState } from 'react';
import { useOrder } from '../../../context/OrderContext';
import { Search, Filter, RefreshCw, Eye } from 'lucide-react';

const OrderHistory = () => {
    const { getHistoryOrders } = useOrder();
    const orders = getHistoryOrders();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const filteredOrders = orders.filter(order => {
        const customerName = order.customer ? order.customer.fullName || '' : 'Client Anonim';
        const matchesSearch =
            customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.includes(searchTerm);

        const matchesFilter = filterStatus ? order.status === filterStatus : true;

        return matchesSearch && matchesFilter;
    });

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'completed': return { backgroundColor: '#dcfce7', color: '#16a34a' };
            case 'cancelled': return { backgroundColor: '#fee2e2', color: '#dc2626' };
            default: return { backgroundColor: '#f1f5f9', color: '#64748b' };
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(amount);
    };

    return (
        <div className="admin-logs-container">
            <div className="actions-bar">
                <h3>Istoric Comenzi</h3>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Aici apar comenzile din zilele anterioare sau cele arhivate.
                </div>
            </div>

            <div className="search-filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Caută după nume client sau ID..."
                        className="form-control"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
                <div style={{ minWidth: '200px', position: 'relative' }}>
                    <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <select
                        className="form-control"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    >
                        <option value="">Toate Statusurile</option>
                        <option value="completed">Finalizate</option>
                        <option value="cancelled">Anulate</option>
                        <option value="archived">Arhivate</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>ID Comandă</th>
                            <th>Client</th>
                            <th>Produse</th>
                            <th>Total</th>
                            <th>Status Final</th>
                            <th>Livrator</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Nu există comenzi în istoric.</td></tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        {new Date(order.created_at).toLocaleString('ro-RO')}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                        #{order.id.slice(0, 8)}
                                    </td>
                                    <td style={{ fontWeight: '600' }}>
                                        {order.customer ? order.customer.fullName : 'Guest'}
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {order.customer?.phone}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.9rem' }}>
                                        {(order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        {formatCurrency(order.finalTotal || order.total)}
                                    </td>
                                    <td>
                                        <span style={{
                                            ...getStatusBadgeStyle(order.status),
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold'
                                        }}>
                                            {order.status === 'completed' ? 'Finalizată' :
                                                order.status === 'cancelled' ? 'Anulată' : order.status}
                                        </span>
                                    </td>
                                    <td>
                                        {order.assignedDriverId ? (
                                            <span style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                                Livrator #{order.assignedDriverId}
                                            </span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderHistory;
