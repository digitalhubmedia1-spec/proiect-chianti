import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Search, Filter, RefreshCw } from 'lucide-react';

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        if (!supabase) return;

        try {
            const { data, error } = await supabase
                .from('admin_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();

        const channel = supabase
            .channel('public:admin_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_logs' }, (payload) => {
                setLogs(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            (log.admin_name && log.admin_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter = filterAction ? log.action === filterAction : true;

        return matchesSearch && matchesFilter;
    });

    const uniqueActions = [...new Set(logs.map(log => log.action))];

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'admin_app': return { backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' };
            case 'operator': return { backgroundColor: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' };
            case 'chef': return { backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' };
            default: return { backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' };
        }
    };

    return (
        <div className="admin-logs-container">
            <div className="actions-bar">
                <h3>Jurnal Activitate (Loguri)</h3>
                <button onClick={fetchLogs} className="btn-icon" title="Reîmprospătează" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="search-filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search className="absolute" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Caută după nume sau detalii..."
                        className="form-control"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
                <div style={{ minWidth: '200px', position: 'relative' }}>
                    <Filter className="absolute" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <select
                        className="form-control"
                        value={filterAction}
                        onChange={e => setFilterAction(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    >
                        <option value="">Toate Acțiunile</option>
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Data / Ora</th>
                            <th>Utilizator</th>
                            <th>Rol</th>
                            <th>Acțiune</th>
                            <th>Detalii</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Se încarcă logurile...</td></tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Nu există activitate înregistrată.</td></tr>
                        ) : (
                            filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        {new Date(log.created_at).toLocaleString('ro-RO')}
                                    </td>
                                    <td style={{ fontWeight: '600', color: '#1e293b' }}>
                                        {log.admin_name}
                                    </td>
                                    <td>
                                        <span style={getRoleBadgeStyle(log.admin_role)}>
                                            {log.admin_role === 'admin_app' ? 'Admin' :
                                                log.admin_role === 'operator' ? 'Operator' :
                                                    log.admin_role === 'chef' ? 'Bucătar' : log.admin_role}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: '600', color: '#334155' }}>
                                        {log.action}
                                    </td>
                                    <td style={{ color: '#475569', fontSize: '0.9rem', maxWidth: '400px' }} title={log.details}>
                                        {log.details && log.details.length > 80 ? log.details.substring(0, 80) + '...' : log.details}
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

export default AdminLogs;
