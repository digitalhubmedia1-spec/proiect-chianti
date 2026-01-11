import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { Mail, Phone, Calendar, Trash2, CheckCircle, XCircle } from 'lucide-react';

const AdminMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setMessages(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const deleteMessage = async (id) => {
        if (!window.confirm('Ești sigur că vrei să ștergi acest mesaj?')) return;
        const { error } = await supabase.from('contact_messages').delete().eq('id', id);
        if (!error) {
            setMessages(prev => prev.filter(m => m.id !== id));
        }
    };

    const markAsRead = async (id, currentStatus) => {
        const { error } = await supabase.from('contact_messages').update({ is_read: !currentStatus }).eq('id', id);
        if (!error) {
            setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: !currentStatus } : m));
        }
    };

    if (loading) return <div>Se încarcă mesajele...</div>;

    return (
        <div className="admin-messages">
            <h3 className="mb-4">Mesaje Contact ({messages.length})</h3>
            <div className="messages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        background: msg.is_read ? '#f8fafc' : 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        borderLeft: msg.is_read ? '1px solid #e2e8f0' : '4px solid #990000',
                        position: 'relative',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>{msg.name}</h4>
                                <small className="text-muted">{new Date(msg.created_at).toLocaleString('ro-RO')}</small>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => markAsRead(msg.id, msg.is_read)}
                                    className="btn-icon"
                                    title={msg.is_read ? "Marchează ca necitit" : "Marchează ca citit"}
                                >
                                    {msg.is_read ? <XCircle size={18} color="#64748b" /> : <CheckCircle size={18} color="#990000" />}
                                </button>
                                <button onClick={() => deleteMessage(msg.id)} className="btn-icon delete"><Trash2 size={18} /></button>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                <Mail size={14} /> <a href={`mailto:${msg.email}`}>{msg.email}</a>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                <Phone size={14} /> <a href={`tel:${msg.phone}`}>{msg.phone}</a>
                            </div>
                            {msg.date && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px', color: '#0369a1' }}>
                                    <Calendar size={14} /> Data Eveniment: {new Date(msg.date).toLocaleDateString('ro-RO')}
                                </div>
                            )}
                        </div>

                        <hr style={{ margin: '0.8rem 0', borderColor: '#f1f5f9' }} />

                        <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>
                            {msg.message}
                        </p>

                        {(msg.event_type || msg.location || msg.guests) && (
                            <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                                {msg.event_type && <span style={{ marginRight: '10px' }}><strong>Tip:</strong> {msg.event_type.join(', ')}</span>}
                                {msg.location && <span style={{ marginRight: '10px' }}><strong>Loc:</strong> {msg.location.join(', ')}</span>}
                                {msg.guests > 0 && <span><strong>Invitați:</strong> {msg.guests}</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {messages.length === 0 && <p className="text-center text-muted">Nu există mesaje.</p>}
        </div>
    );
};

export default AdminMessages;
