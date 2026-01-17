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
                .limit(100); // Limit to last 100 for performance

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

        // Realtime subscription
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

    return (
        <div className="admin-logs-container">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Jurnal Activitate (Loguri)</h2>
                <button onClick={fetchLogs} className="btn-icon" title="Reîmprospătează">
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="search-filter-bar flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Caută după nume sau detalii..."
                        className="pl-10 p-2 border rounded-lg w-full"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative w-64">
                    <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select
                        className="pl-10 p-2 border rounded-lg w-full appearance-none"
                        value={filterAction}
                        onChange={e => setFilterAction(e.target.value)}
                    >
                        <option value="">Toate Acțiunile</option>
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-sm">
                        <tr>
                            <th className="p-4 border-b">Data / Ora</th>
                            <th className="p-4 border-b">Utilizator</th>
                            <th className="p-4 border-b">Rol</th>
                            <th className="p-4 border-b">Acțiune</th>
                            <th className="p-4 border-b">Detalii</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">Se încarcă logurile...</td></tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">Nu există activitate înregistrată.</td></tr>
                        ) : (
                            filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(log.created_at).toLocaleString('ro-RO')}
                                    </td>
                                    <td className="p-4 font-medium text-gray-800">
                                        {log.admin_name}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                            ${log.admin_role === 'admin_app' ? 'bg-purple-100 text-purple-700' :
                                                log.admin_role === 'operator' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'}`}>
                                            {log.admin_role === 'admin_app' ? 'Admin' :
                                                log.admin_role === 'operator' ? 'Operator' :
                                                    log.admin_role === 'chef' ? 'Bucătar' : log.admin_role}
                                        </span>
                                    </td>
                                    <td className="p-4 font-semibold text-gray-700">
                                        {log.action}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 max-w-md truncate" title={log.details}>
                                        {log.details}
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
