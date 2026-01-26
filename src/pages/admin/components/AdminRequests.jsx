import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { logAction } from '../../../utils/adminLogger';
import { Mail, Phone, Calendar, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const RequestCard = ({ req, onDelete, onMarkMarkRead }) => {
    const [expanded, setExpanded] = useState(false);

    let details = null;
    let isJson = false;

    try {
        // Try to parse message as JSON. Handle potential "Date: " prefix from legacy.
        const msgContent = req.message || '';
        const jsonStr = msgContent.startsWith('Date: ') ? msgContent.substring(6) : msgContent;
        details = JSON.parse(jsonStr);
        if (details && typeof details === 'object') {
            isJson = true;
        }
    } catch (e) {
        // Not JSON, treat as plain text
        isJson = false;
    }

    const renderList = (title, items) => {
        if (!items || items.length === 0) return null;
        return (
            <div style={{ marginBottom: '1rem' }}>
                <strong style={{ display: 'block', color: '#444', marginBottom: '0.2rem' }}>{title}:</strong>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#666', fontSize: '0.9rem' }}>
                    {items.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
            </div>
        );
    };

    return (
        <div style={{
            background: req.is_read ? '#f8fafc' : 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.5rem',
            borderLeft: req.is_read ? '1px solid #e2e8f0' : '4px solid #800020',
            position: 'relative',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                    <h4 style={{ margin: 0, color: '#1e293b' }}>{req.salon}</h4>
                    <span style={{ fontSize: '0.85rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', marginTop: '6px', display: 'inline-block', fontWeight: '500' }}>
                        {req.event_type}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => onMarkMarkRead(req.id, req.is_read)}
                        className="btn-icon"
                        title={req.is_read ? "Marchează ca necitit" : "Marchează ca citit"}
                    >
                        {req.is_read ? <XCircle size={18} color="#64748b" /> : <CheckCircle size={18} color="#800020" />}
                    </button>
                    <button onClick={() => onDelete(req.id)} className="btn-icon delete" title="Șterge"><Trash2 size={18} /></button>
                </div>
            </div>

            <div style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                    <strong>Client:</strong> {req.name} {req.guests > 0 ? `(${req.guests} pers.)` : (details?.selections?.guestCount ? `(${details.selections.guestCount} pers.)` : '')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                    <Mail size={14} /> <a href={`mailto:${req.email}`} style={{ color: 'inherit' }}>{req.email}</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                    <Phone size={14} /> <a href={`tel:${req.phone}`} style={{ color: 'inherit' }}>{req.phone}</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '10px' }}>
                    <Calendar size={14} />
                    <strong>Data:</strong> {req.date_primary ? new Date(req.date_primary).toLocaleDateString('ro-RO') : 'Nespecificată'}
                </div>
            </div>

            {/* Detailed View or Message */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginTop: 'auto', border: '1px solid #f1f5f9' }}>
                {isJson ? (
                    <div>
                        <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>Detalii Configurare:</span>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                style={{
                                    background: 'none', border: 'none', color: '#800020',
                                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                            >
                                {expanded ? 'Ascunde Detalii' : 'Vezi Configurația'}
                                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>

                        {expanded && details.selections && (
                            <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                {renderList('Meniu', details.selections.menuOptions)}
                                {renderList('Baruri', details.selections.barOptions)}
                                {renderList('Muzică', details.selections.music)}
                                {renderList('Foto & Video', details.selections.photoVideo)}
                                {renderList('Decor', details.selections.decor)}
                                {renderList('Momente Speciale', details.selections.specialMoments)}
                                {renderList('Logistică', details.selections.logistics)}
                                {renderList('Personal', details.selections.staff)}
                                {renderList('Extra', details.selections.extraServices)}

                                {details.observations && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <strong style={{ color: '#444' }}>Observații:</strong>
                                        <p style={{ fontSize: '0.9rem', color: '#555', fontStyle: 'italic', marginTop: '0.2rem' }}>
                                            "{details.observations}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                        {!expanded && details.selections && (
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>
                                {details.selections.menuOptions?.length || 0} opțiuni meniu, {details.selections.music?.length || 0} opțiuni muzică...
                            </p>
                        )}
                    </div>
                ) : (
                    <p style={{ whiteSpace: 'pre-wrap', color: '#334155', fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>
                        "{req.message || 'Fără mesaj adăugat.'}"
                    </p>
                )}
            </div>

            <small className="text-muted" style={{ display: 'block', marginTop: '1rem', textAlign: 'right', fontSize: '0.75rem' }}>
                Trimis: {new Date(req.created_at).toLocaleString('ro-RO')}
            </small>
        </div>
    );
};

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
        setRequests(prev => prev.filter(r => r.id !== id));
        logAction('CERERI', `Cerere ștearsă #${id}`);
    };

    const markAsRead = async (id, currentStatus) => {
        const { error } = await supabase.from('event_requests').update({ is_read: !currentStatus }).eq('id', id);
        if (!error) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, is_read: !currentStatus } : r));
        }
    };

    if (loading) return <div>Se încarcă cererile...</div>;

    // Filter Logic
    const todayStr = new Date().toDateString();

    const todayRequests = requests.filter(req => {
        const reqDate = new Date(req.created_at);
        return reqDate.toDateString() === todayStr;
    });

    const historyRequests = requests.filter(req => {
        const reqDate = new Date(req.created_at);
        return reqDate.toDateString() !== todayStr;
    });

    return (
        <div className="admin-requests">
            {/* TODAY'S REQUESTS - CARDS */}
            <h3 className="mb-4">Cereri Primite Astăzi ({todayRequests.length})</h3>
            <div className="requests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {todayRequests.length > 0 ? todayRequests.map(req => (
                    <RequestCard
                        key={req.id}
                        req={req}
                        onDelete={deleteRequest}
                        onMarkMarkRead={markAsRead}
                    />
                )) : (
                    <p className="text-muted" style={{ gridColumn: '1/-1', fontStyle: 'italic' }}>Nicio cerere nouă astăzi.</p>
                )}
            </div>

            {/* HISTORY - TABLE */}
            <h3 className="mb-4" style={{ borderTop: '1px solid #eee', paddingTop: '2rem' }}>Istoric Cereri</h3>
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Dată</th>
                            <th>Client</th>
                            <th>Eveniment</th>
                            <th>Salon</th>
                            <th>Contact</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyRequests.map(req => (
                            <tr key={req.id} style={{ fontWeight: req.is_read ? 'normal' : 'bold', background: req.is_read ? 'white' : '#fff1f2' }}>
                                <td style={{ textAlign: 'center' }}>
                                    {req.is_read ?
                                        <CheckCircle size={18} color="#16a34a" title="Citit" /> :
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center', color: '#be123c' }}>
                                            <span style={{ width: '8px', height: '8px', background: '#be123c', borderRadius: '50%' }}></span>
                                            Nou
                                        </div>
                                    }
                                </td>
                                <td>{new Date(req.created_at).toLocaleString('ro-RO')}</td>
                                <td>{req.name}</td>
                                <td>{req.event_type}</td>
                                <td>{req.salon}</td>
                                <td>
                                    <div style={{ fontSize: '0.85rem' }}>{req.phone}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{req.email}</div>
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => markAsRead(req.id, req.is_read)}
                                            title={req.is_read ? "Marchează ca necitit" : "Marchează ca citit"}
                                        >
                                            {req.is_read ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                        </button>
                                        <button className="btn-icon delete" onClick={() => deleteRequest(req.id)}><Trash2 size={16} /></button>
                                        {/* For detailed view in table, we might need a modal or expand row. Keeping it simple for now as requested. */}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {historyRequests.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                                    Nu există istoric de cereri.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminRequests;
