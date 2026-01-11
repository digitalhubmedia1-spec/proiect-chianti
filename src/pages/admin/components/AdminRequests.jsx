import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { Mail, Phone, Calendar, Trash2, CheckCircle, XCircle, MapPin } from 'lucide-react';

const AdminRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data, error } = await supabase
            .from('event_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const deleteRequest = async (id) => {
        if (!window.confirm('Ești sigur că vrei să ștergi această cerere?')) return;
        const { error } = await supabase.from('event_requests').delete().eq('id', id);
        if (!error) {
            setRequests(prev => prev.filter(r => r.id !== id));
        }
    };

    const markAsRead = async (id, currentStatus) => {
        const { error } = await supabase.from('event_requests').update({ is_read: !currentStatus }).eq('id', id);
        if (!error) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, is_read: !currentStatus } : r));
        }
    };

    if (loading) return <div>Se încarcă cererile...</div>;

    return (
        <div className="admin-requests">
            <h3 className="mb-4">Cereri Evenimente / Saloane ({requests.length})</h3>
            <div className="requests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                {requests.map(req => (
                    <div key={req.id} style={{
                        background: req.is_read ? '#f8fafc' : 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        borderLeft: req.is_read ? '1px solid #e2e8f0' : '4px solid #800020',
                        position: 'relative',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>{req.salon}</h4>
                                <span style={{ fontSize: '0.85rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                                    {req.event_type}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => markAsRead(req.id, req.is_read)}
                                    className="btn-icon"
                                    title={req.is_read ? "Marchează ca necitit" : "Marchează ca citit"}
                                >
                                    {req.is_read ? <XCircle size={18} color="#64748b" /> : <CheckCircle size={18} color="#800020" />}
                                </button>
                                <button onClick={() => deleteRequest(req.id)} className="btn-icon delete"><Trash2 size={18} /></button>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                <strong>Client:</strong> {req.name} {req.guests > 0 && `(${req.guests} pers.)`}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                <Mail size={14} /> <a href={`mailto:${req.email}`}>{req.email}</a>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                <Phone size={14} /> <a href={`tel:${req.phone}`}>{req.phone}</a>
                            </div>
                        </div>

                        <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px', color: '#166534', fontWeight: 'bold' }}>
                                <Calendar size={16} /> Data Principală: {req.date_primary ? new Date(req.date_primary).toLocaleDateString('ro-RO') : 'Nespecificată'}
                            </div>
                            {(req.date_secondary || req.date_tertiary) && (
                                <div style={{ fontSize: '0.8rem', color: '#15803d', marginLeft: '24px' }}>
                                    Alt: {req.date_secondary && new Date(req.date_secondary).toLocaleDateString('ro-RO')}
                                    {req.date_secondary && req.date_tertiary && ', '}
                                    {req.date_tertiary && new Date(req.date_tertiary).toLocaleDateString('ro-RO')}
                                </div>
                            )}
                        </div>

                        <p style={{ whiteSpace: 'pre-wrap', color: '#334155', fontStyle: 'italic', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px' }}>
                            "{req.message || 'Fără mesaj adăugat.'}"
                        </p>
                        <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem', textAlign: 'right' }}>
                            Trimis la: {new Date(req.created_at).toLocaleString('ro-RO')}
                        </small>
                    </div>
                ))}
            </div>
            {requests.length === 0 && <p className="text-center text-muted">Nu există cereri.</p>}
        </div>
    );
};

export default AdminRequests;
