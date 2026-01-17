import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Search, Filter, History, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
// import './AdminLogs.css'; // Removed: Styles use global Admin.css

const StockHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOp, setFilterOp] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        if (!supabase) return;

        const { data, error } = await supabase
            .from('stock_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) console.error("Error fetching stock history:", error);
        else setLogs(data || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();

        const channel = supabase
            .channel('public:stock_history')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_history' }, (payload) => {
                setLogs(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.category && log.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.operator && log.operator.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterOp ? log.operation === filterOp : true;
        return matchesSearch && matchesFilter;
    });

    const getOpBadge = (op) => {
        switch (op) {
            case 'INTRARE': return <span className="badge badge-success"><TrendingUp size={14} style={{ marginRight: 4 }} /> Intrare</span>;
            case 'AJUSTARE': return <span className="badge badge-warning"><TrendingDown size={14} style={{ marginRight: 4 }} /> Ajustare</span>;
            case 'STERGERE': return <span className="badge badge-danger"><Trash2 size={14} style={{ marginRight: 4 }} /> Ștergere</span>;
            default: return <span className="badge badge-secondary">{op}</span>;
        }
    };

    return (
        <div className="admin-logs-container">
            <div className="actions-bar">
                <h3>Loguri Stocuri</h3>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Istoric detaliat al mișcărilor de stoc.
                </div>
            </div>

            <div className="search-filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Caută produs, categorie sau operator..."
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
                        value={filterOp}
                        onChange={e => setFilterOp(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    >
                        <option value="">Toate Operațiunile</option>
                        <option value="INTRARE">Intrare Stoc</option>
                        <option value="AJUSTARE">Ajustare / Modificare</option>
                        <option value="STERGERE">Ștergere Produs</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Produs</th>
                            <th>Categorie</th>
                            <th>Cantitate</th>
                            <th>Operațiune</th>
                            <th>Operator</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Nu există date.</td></tr>
                        ) : (
                            filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        {new Date(log.created_at).toLocaleString('ro-RO')}
                                    </td>
                                    <td style={{ fontWeight: '600' }}>{log.item_name}</td>
                                    <td>{log.category || '-'}</td>
                                    <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                                        {log.quantity} {log.unit}
                                    </td>
                                    <td>{getOpBadge(log.operation)}</td>
                                    <td style={{ fontSize: '0.9rem' }}>{log.operator || 'Sistem'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockHistory;
