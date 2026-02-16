import React, { useState } from 'react';
import { useOrder } from '../../../context/OrderContext';
import { Search, Filter, RefreshCw, Eye, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const removeDiacritics = (str) => {
        return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ț/g, "t").replace(/Ț/g, "T").replace(/ș/g, "s").replace(/Ș/g, "S") : "";
    };

    const exportToCSV = () => {
        if (filteredOrders.length === 0) {
            alert('Nu există date de exportat!');
            return;
        }

        const headers = ["Data", "ID Comanda", "Nume Client", "Telefon", "Produse", "Total", "Status", "Livrator"];
        const rows = filteredOrders.map(order => [
            new Date(order.created_at).toLocaleString('ro-RO'),
            order.id,
            order.customer ? order.customer.fullName : 'Guest',
            order.customer?.phone || '-',
            (order.items || []).map(i => `${i.quantity}x ${i.name}`).join(' | '),
            (order.finalTotal || order.total).toFixed(2),
            order.status,
            order.assignedDriverId || '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Add BOM for Excel UTF-8
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

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor(128, 0, 32); // Chianti Red
        doc.text(removeDiacritics("Raport Istoric Comenzi"), 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generat la: ${new Date().toLocaleString('ro-RO')}`, 14, 30);

        const tableData = filteredOrders.map(order => [
            new Date(order.created_at).toLocaleDateString('ro-RO'),
            order.id.slice(0, 8),
            removeDiacritics(order.customer ? order.customer.fullName : 'Guest'),
            order.customer?.phone || '-',
            removeDiacritics((order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')),
            `${(order.finalTotal || order.total).toFixed(2)} RON`,
            order.status === 'completed' ? 'Finalizata' : (order.status === 'cancelled' ? 'Anulata' : order.status),
            order.assignedDriverId || '-'
        ]);

        autoTable(doc, {
            startY: 35,
            head: [['Data', 'ID', 'Client', 'Telefon', 'Produse', 'Total', 'Status', 'Livrator']],
            body: tableData,
            headStyles: { fillColor: [128, 0, 32], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                4: { cellWidth: 50 }, // Products wider
                0: { cellWidth: 20 },
                1: { cellWidth: 20 },
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
                    Aici apar comenzile din zilele anterioare sau cele arhivate.
                </div>
            </div>

            <div className="search-filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
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
                    <div style={{ minWidth: '200px', position: 'relative' }}>
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
                    <button onClick={exportToCSV} className="btn" style={{ background: '#2563eb', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <FileDown size={16} /> Export CSV
                    </button>
                    <button onClick={exportToPDF} className="btn" style={{ background: '#dc2626', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <FileDown size={16} /> Export PDF
                    </button>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>ID Comandă</th>
                            <th>Nume Client</th>
                            <th>Telefon</th>
                            <th>Produse</th>
                            <th>Total</th>
                            <th>Status Final</th>
                            <th>Livrator</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Nu există comenzi în istoric.</td></tr>
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
                                    </td>
                                    <td style={{ fontSize: '0.9rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                        {order.customer?.phone || '-'}
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
