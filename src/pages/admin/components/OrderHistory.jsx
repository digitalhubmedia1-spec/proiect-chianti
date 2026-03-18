import React, { useState } from 'react';
import { useOrder } from '../../../context/OrderContext';
import { Search, Filter, RefreshCw, Eye, FileDown, MapPin, MessageSquare, List, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const OrderHistory = () => {
    const { getHistoryOrders } = useOrder();
    const orders = getHistoryOrders();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showExportOptions, setShowExportOptions] = useState(false);
    
    // PDF Export Options
    const [pdfOrientation, setPdfOrientation] = useState('landscape'); // Default to landscape for more columns
    const [selectedFields, setSelectedFields] = useState({
        created_at: true,
        id: true,
        customerName: true,
        phone: true,
        address: true,
        details: true,
        items: true,
        total: true,
        status: true,
        driver: false,
        method: false,
        time: true
    });

    const fieldLabels = {
        created_at: 'Data',
        id: 'ID Comandă',
        customerName: 'Client',
        phone: 'Telefon',
        address: 'Adresă Livrare',
        details: 'Detalii Livrare',
        items: 'Produse',
        total: 'Total',
        status: 'Status',
        driver: 'Livrator',
        method: 'Metodă',
        time: 'Ora'
    };

    const toggleField = (field) => {
        setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const filteredOrders = orders.filter(order => {
        const customerName = order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.fullName || '' : 'Client Anonim';
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

    const removeDiacritics = (str) => {
        if (!str) return "";
        return String(str)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ț/g, "t").replace(/Ț/g, "T")
            .replace(/ș/g, "s").replace(/Ș/g, "S")
            .replace(/ă/g, "a").replace(/Ă/g, "A")
            .replace(/î/g, "i").replace(/Î/g, "I")
            .replace(/â/g, "a").replace(/Â/g, "A");
    };

    const getOrderAddress = (order) => {
        if (!order.customer) return '-';
        const { address, neighborhood, city } = order.customer;
        const isSelfService = order.customer.deliveryMethod === 'pickup' || order.customer.deliveryMethod === 'dinein' || order.customer.deliveryMethod === 'event-restaurant';
        if (isSelfService) return 'Ridicare/Dine-in';
        return [address, neighborhood, city].filter(Boolean).join(', ');
    };

    const formatOrderItems = (items) => {
        return (items || []).map(i => {
            let text = `${i.quantity}x ${i.name}`;
            if (i.selectedOptions && Object.keys(i.selectedOptions).length > 0) {
                const options = Object.entries(i.selectedOptions)
                    .map(([group, val]) => `${group}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join('; ');
                text += ` (${options})`;
            }
            return text;
        }).join(' | ');
    };

    const exportToCSV = () => {
        if (filteredOrders.length === 0) {
            alert('Nu există date de exportat!');
            return;
        }

        const activeFields = Object.keys(selectedFields).filter(f => selectedFields[f]);
        const headers = activeFields.map(f => fieldLabels[f]);

        const rows = filteredOrders.map(order => {
            return activeFields.map(field => {
                switch (field) {
                    case 'created_at': return new Date(order.created_at).toLocaleString('ro-RO');
                    case 'id': return order.id;
                    case 'customerName': return order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.fullName || 'Guest' : 'Guest';
                    case 'phone': return order.customer?.phone || '-';
                    case 'address': return getOrderAddress(order);
                    case 'details': return order.customer?.details || '-';
                    case 'items': return formatOrderItems(order.items);
                    case 'total': return (order.finalTotal || order.total).toFixed(2);
                    case 'status': return order.status;
                    case 'driver': return order.assignedDriverId || '-';
                    case 'method': return order.customer?.deliveryMethod || '-';
                    case 'time': return order.customer?.deliveryTime || '-';
                    default: return '';
                }
            });
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Istoric_Comenzi_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        if (filteredOrders.length === 0) {
            alert('Nu există date de exportat!');
            return;
        }

        const doc = new jsPDF({
            orientation: pdfOrientation,
            unit: 'mm',
            format: 'a4'
        });

        const activeFields = Object.keys(selectedFields).filter(f => selectedFields[f]);
        const headers = activeFields.map(f => removeDiacritics(fieldLabels[f]));

        doc.setFontSize(18);
        doc.setTextColor(128, 0, 32); // Chianti Red
        doc.text(removeDiacritics("Raport Istoric Comenzi"), 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generat la: ${new Date().toLocaleString('ro-RO')} | Orientare: ${pdfOrientation === 'portrait' ? 'Portret' : 'Vedere'}`, 14, 30);

        const tableData = filteredOrders.map(order => {
            return activeFields.map(field => {
                switch (field) {
                    case 'created_at': return new Date(order.created_at).toLocaleDateString('ro-RO');
                    case 'id': return order.id.slice(0, 8);
                    case 'customerName': {
                        const name = order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.fullName || 'Guest' : 'Guest';
                        return removeDiacritics(name);
                    }
                    case 'phone': return order.customer?.phone || '-';
                    case 'address': return removeDiacritics(getOrderAddress(order));
                    case 'details': return removeDiacritics(order.customer?.details || '-');
                    case 'items': return removeDiacritics(formatOrderItems(order.items));
                    case 'total': return `${(order.finalTotal || order.total).toFixed(2)} RON`;
                    case 'status': return order.status === 'completed' ? 'Finalizata' : (order.status === 'cancelled' ? 'Anulata' : order.status);
                    case 'driver': return order.assignedDriverId || '-';
                    case 'method': return removeDiacritics(order.customer?.deliveryMethod || '-');
                    case 'time': return order.customer?.deliveryTime || '-';
                    default: return '';
                }
            });
        });

        autoTable(doc, {
            startY: 35,
            head: [headers],
            body: tableData,
            headStyles: { fillColor: [128, 0, 32], textColor: 255, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { fontSize: pdfOrientation === 'landscape' ? 7 : 8, cellPadding: 2 },
            styles: { overflow: 'linebreak', cellWidth: 'wrap' },
            columnStyles: {
                ...activeFields.reduce((acc, field, idx) => {
                    if (field === 'items') acc[idx] = { cellWidth: pdfOrientation === 'landscape' ? 50 : 35 };
                    if (field === 'address') acc[idx] = { cellWidth: pdfOrientation === 'landscape' ? 40 : 30 };
                    return acc;
                }, {})
            },
            theme: 'grid'
        });

        doc.save(`Istoric_Comenzi_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="admin-logs-container">
            <div className="actions-bar">
                <h3>Istoric Comenzi</h3>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Aici apar comenzile finalizate, arhivate sau din zilele anterioare.
                </div>
            </div>

            <div className="search-filter-bar" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Caută după nume client sau ID..."
                                className="form-control"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '40px', width: '100%' }}
                            />
                        </div>
                        <div style={{ width: '200px', position: 'relative' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <select
                                className="form-control"
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                style={{ paddingLeft: '40px', width: '100%' }}
                            >
                                <option value="">Toate Statusurile</option>
                                <option value="completed">Finalizate</option>
                                <option value="cancelled">Anulate</option>
                                <option value="archived">Arhivate</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                            onClick={() => setShowExportOptions(!showExportOptions)} 
                            className="btn" 
                            style={{ 
                                background: showExportOptions ? '#1e293b' : '#f8fafc', 
                                color: showExportOptions ? 'white' : '#1e293b', 
                                border: '1px solid #e2e8f0',
                                display: 'flex', gap: '0.5rem', alignItems: 'center' 
                            }}
                        >
                            <FileDown size={16} /> Configurare Export {showExportOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>

                {showExportOptions && (
                    <div style={{ 
                        marginTop: '1rem', 
                        padding: '1.5rem', 
                        background: '#f8fafc', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0',
                        animation: 'slideDown 0.3s ease-out'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {Object.keys(fieldLabels).map(field => (
                                <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedFields[field]} 
                                        onChange={() => toggleField(field)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    {fieldLabels[field]}
                                </label>
                            ))}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>Orientare PDF:</span>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input 
                                        type="radio" 
                                        name="orientation" 
                                        value="portrait" 
                                        checked={pdfOrientation === 'portrait'} 
                                        onChange={() => setPdfOrientation('portrait')}
                                    /> Portret
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input 
                                        type="radio" 
                                        name="orientation" 
                                        value="landscape" 
                                        checked={pdfOrientation === 'landscape'} 
                                        onChange={() => setPdfOrientation('landscape')}
                                    /> Vedere (Landscape)
                                </label>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={exportToCSV} className="btn" style={{ background: '#2563eb', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <FileDown size={16} /> Export CSV
                                </button>
                                <button onClick={exportToPDF} className="btn" style={{ background: '#dc2626', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <FileDown size={16} /> Export PDF
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Nume Client</th>
                            <th>Contact / Adresă</th>
                            <th>Produse</th>
                            <th>Total</th>
                            <th>Status / Detalii</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Nu există comenzi în istoric.</td></tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} style={{ verticalAlign: 'top' }}>
                                    <td style={{ minWidth: '120px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                                            {new Date(order.created_at).toLocaleDateString('ro-RO')}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                            {new Date(order.created_at).toLocaleTimeString('ro-RO')}
                                        </div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', marginTop: '4px', color: '#94a3b8' }}>
                                            #{order.id.slice(0, 8)}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '700', color: '#0f172a' }}>
                                            {order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.fullName || 'Guest' : 'Guest'}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                            {order.customer?.phone || '-'}
                                        </div>
                                        {order.customer?.companyName && (
                                            <div style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', width: 'fit-content' }}>
                                                {order.customer.companyName}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ maxWidth: '250px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                            <MapPin size={14} style={{ color: '#64748b', marginTop: '3px', flexShrink: 0 }} />
                                            <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.4' }}>
                                                {getOrderAddress(order)}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                                            Metodă: {order.customer?.deliveryMethod || '-'}
                                        </div>
                                        {order.customer?.deliveryTime && (
                                            <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '600' }}>
                                                Ora cerută: {order.customer.deliveryTime}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                                            {(order.items || []).map((item, idx) => (
                                                <div key={idx} style={{ marginBottom: '4px', paddingBottom: '4px', borderBottom: idx < order.items.length - 1 ? '1px dashed #f1f5f9' : 'none' }}>
                                                    <span style={{ fontWeight: '800', marginRight: '4px' }}>{item.quantity}x</span>
                                                    {item.name}
                                                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                                        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginLeft: '1.5rem', fontStyle: 'italic' }}>
                                                            {Object.entries(item.selectedOptions).map(([g, v]) => `${g}: ${Array.isArray(v) ? v.join(', ') : v}`).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>
                                            {formatCurrency(order.finalTotal || order.total)}
                                        </div>
                                        {order.deliveryCost > 0 && (
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                (Transp: {order.deliveryCost.toFixed(2)})
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{
                                                ...getStatusBadgeStyle(order.status),
                                                padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase'
                                            }}>
                                                {order.status === 'completed' ? 'Finalizată' :
                                                    order.status === 'cancelled' ? 'Anulată' : order.status}
                                            </span>
                                        </div>
                                        
                                        {order.customer?.details && (
                                            <div style={{ 
                                                display: 'flex', gap: '6px', 
                                                background: '#fff7ed', padding: '6px', borderRadius: '6px', 
                                                border: '1px solid #ffedd5', color: '#9a3412', fontSize: '0.8rem'
                                            }}>
                                                <MessageSquare size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <span style={{ fontStyle: 'italic' }}>{order.customer.details}</span>
                                            </div>
                                        )}
                                        
                                        {order.assignedDriverId && (
                                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CheckCircle2 size={14} style={{ color: '#16a34a' }} /> Livrat de ID #{order.assignedDriverId}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .admin-table th {
                    background: #f8fafc;
                    padding: 1rem;
                    text-align: left;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    border-bottom: 2px solid #e2e8f0;
                }
                .admin-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #f1f5f9;
                }
                .admin-table tr:hover {
                    background-color: #f8fafc;
                }
            `}} />
        </div>
    );
};

export default OrderHistory;
