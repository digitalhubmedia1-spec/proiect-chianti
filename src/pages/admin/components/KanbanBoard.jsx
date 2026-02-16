import React from 'react';
import OrderCard from './OrderCard';
import { useOrder } from '../../../context/OrderContext';
import { ArrowRight, Check, Trash2, ArrowLeft } from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';

const KanbanColumn = ({ title, status, orders, onMove, onDelete, drivers, onAssignDriver }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'preparing': return '#3498db';
            case 'delivering': return '#9b59b6';
            case 'completed': return '#2ecc71';
            case 'cancelled': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    return (
        <div style={{
            flex: 1,
            background: '#f8fafc',
            padding: '1.25rem',
            borderRadius: '16px',
            height: 'calc(100vh - 220px)', // Fixed height to force internal scroll
            minHeight: '500px',
            minWidth: '350px', // Prevent cramping
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden' // Ensure children don't bleed out
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                borderBottom: `2px solid ${getStatusColor()}`,
                paddingBottom: '0.75rem',
                flexShrink: 0 // Prevent header from shrinking
            }}>
                <h4 style={{
                    margin: 0,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                    color: '#475569'
                }}>
                    {title}
                </h4>
                <span style={{
                    background: getStatusColor(),
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                }}>
                    {orders.length}
                </span>
            </div>

            <div className="kanban-cards" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                overflowY: 'auto', // ENABLE SCROLL HERE
                paddingRight: '6px', // Space for scrollbar
                paddingBottom: '10px'
            }}>
                {orders.map(order => (
                    <div key={order.id} style={{ position: 'relative', transition: 'transform 0.2s' }}>
                        <OrderCard order={order} />

                        {/* Actions Container */}
                        <div style={{
                            background: 'white',
                            borderRadius: '0 0 12px 12px',
                            padding: '1rem',
                            marginTop: '-12px', // Connect visually with card
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #f0f0f0',
                            borderTop: 'none'
                        }}>
                            {/* Driver Assignment for Delivering Orders - ONLY for Delivery Methods */}
                            {status === 'delivering' && (order.customer?.deliveryMethod === 'delivery' || order.customer?.deliveryMethod === 'event-location') && (
                                <div className="mb-3">
                                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                        ASIGNEAZĂ LIVRATOR
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select
                                            className="form-select form-select-sm"
                                            value={order.assignedDriverId || ""}
                                            onChange={(e) => onAssignDriver(order.id, e.target.value)}
                                            style={{
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '0.9rem',
                                                padding: '6px'
                                            }}
                                        >
                                            <option value="">-- Alege Livrator --</option>
                                            {(drivers || []).map(driver => (
                                                <option key={driver.id} value={driver.id}>
                                                    {driver.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {order.driverStatus && (
                                        <div style={{ marginTop: '6px' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: order.driverStatus === 'delivered' ? '#dcfce7' : order.driverStatus === 'en_route' ? '#fef9c3' : '#f1f5f9',
                                                color: order.driverStatus === 'delivered' ? '#166534' : order.driverStatus === 'en_route' ? '#854d0e' : '#475569',
                                                fontWeight: '600',
                                                border: '1px solid transparent',
                                                borderColor: order.driverStatus === 'delivered' ? '#bbf7d0' : order.driverStatus === 'en_route' ? '#fde047' : '#e2e8f0'
                                            }}>
                                                Status: {order.driverStatus === 'delivered' ? 'Livrat' : order.driverStatus === 'en_route' ? 'Pe drum' : 'Asignat'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {status === 'preparing' && (
                                    <button
                                        onClick={() => onMove(order.id, 'delivering')}
                                        style={{
                                            flex: 1,
                                            background: '#800020', // Chianti Red
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            boxShadow: '0 2px 4px rgba(128, 0, 32, 0.2)'
                                        }}
                                    >
                                        Spre Livrare <ArrowRight size={14} />
                                    </button>
                                )}
                                {status === 'delivering' && (
                                    <>
                                        <button
                                            onClick={() => onMove(order.id, 'preparing')}
                                            style={{
                                                background: '#f1f5f9',
                                                color: '#475569',
                                                border: '1px solid #cbd5e1',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                            title="Înapoi la Preparare"
                                        >
                                            <ArrowLeft size={14} />
                                        </button>
                                        <button
                                            onClick={() => onMove(order.id, 'completed')}
                                            style={{
                                                flex: 1, // Take remaining space
                                                background: '#10b981', // Emerald Green
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                                            }}
                                        >
                                            Finalizează <Check size={14} />
                                        </button>
                                    </>
                                )}
                                {(status === 'completed' || status === 'cancelled') && (
                                    <button
                                        onClick={() => onDelete(order.id)}
                                        style={{
                                            flex: 1,
                                            background: '#fee2e2',
                                            color: '#ef4444',
                                            border: '1px solid #fecaca',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        Șterge <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const KanbanBoard = () => {
    const { getActiveOrders, updateOrderStatus, deleteOrder, assignDriverToOrder } = useOrder();
    const { getDrivers } = useAuth();
    const [drivers, setDrivers] = React.useState([]);

    React.useEffect(() => {
        const fetchDrivers = async () => {
            if (getDrivers) {
                const data = await getDrivers();
                setDrivers(data || []);
            }
        };
        fetchDrivers();
    }, [getDrivers]);

    const activeOrders = getActiveOrders();

    // Filter active orders by status and ensure they are NOT archived
    const preparing = activeOrders.filter(o => o.status === 'preparing' && !o.archived);
    const delivering = activeOrders.filter(o => o.status === 'delivering' && !o.archived);
    const completed = activeOrders.filter(o => o.status === 'completed' && !o.archived);
    const cancelled = activeOrders.filter(o => o.status === 'cancelled' && !o.archived);

    const handleMove = (orderId, nextStatus) => {
        updateOrderStatus(orderId, nextStatus);
    };

    const handleAssign = (orderId, driverId) => {
        assignDriverToOrder(orderId, driverId);
    };

    return (
        <div className="kanban-board" style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            <KanbanColumn
                title="În Preparare"
                status="preparing"
                orders={preparing}
                onMove={handleMove}
            />
            <KanbanColumn
                title="Livrare / Ridicare"
                status="delivering"
                orders={delivering}
                onMove={handleMove}
                drivers={drivers}
                onAssignDriver={handleAssign}
            />
            <KanbanColumn
                title="Finalizate"
                status="completed"
                orders={completed}
                onMove={handleMove}
                onDelete={deleteOrder}
            />
            <KanbanColumn
                title="Anulate"
                status="cancelled"
                orders={cancelled}
                onMove={handleMove}
                onDelete={deleteOrder}
            />
        </div>
    );
};

export default KanbanBoard;
