
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Calendar, MapPin, Users, Trash2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    event_halls (name)
                `)
                .order('start_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sigur doriți să ștergeți acest eveniment? Această acțiune este ireversibilă.')) return;

        try {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Eroare la ștergere: ' + error.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return '#f59e0b'; // Amber
            case 'confirmed': return '#3b82f6'; // Blue
            case 'in_progress': return '#10b981'; // Emerald
            case 'completed': return '#6366f1'; // Indigo
            case 'cancelled': return '#ef4444'; // Red
            default: return '#64748b';
        }
    };

    const filteredEvents = filterStatus === 'all'
        ? events
        : events.filter(e => e.status === filterStatus);

    return (
        <div className="admin-events-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            <button
                onClick={() => navigate('/admin/dashboard')}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', color: '#6b7280',
                    cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.5rem',
                    padding: 0
                }}
            >
                <ArrowLeft size={18} /> Înapoi la Panou
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#111827' }}>Management Evenimente</h1>
                <button
                    onClick={() => navigate('/admin/events/new')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        backgroundColor: '#111827', color: 'white',
                        padding: '10px 20px', borderRadius: '8px',
                        fontWeight: '600', border: 'none', cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Eveniment Nou
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
                {['all', 'draft', 'completed'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        style={{
                            padding: '6px 16px', borderRadius: '20px',
                            border: `1px solid ${filterStatus === status ? '#111827' : '#e5e7eb'}`,
                            backgroundColor: filterStatus === status ? '#111827' : 'white',
                            color: filterStatus === status ? 'white' : '#374151',
                            cursor: 'pointer', fontWeight: '500'
                        }}
                    >
                        {{
                            all: 'Toate',
                            draft: 'Ciornă',
                            confirmed: 'Confirmat',
                            in_progress: 'În Desfășurare',
                            completed: 'Finalizat',
                            cancelled: 'Anulat'
                        }[status]}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Se încarcă evenimentele...</div>
            ) : filteredEvents.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem',
                    backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #e5e7eb'
                }}>
                    <Calendar size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Niciun eveniment găsit</h3>
                    <p style={{ color: '#6b7280' }}>Creează un eveniment nou pentru a începe planificarea.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {filteredEvents.map(event => (
                        <div key={event.id} style={{
                            backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6',
                            transition: 'transform 0.2s', cursor: 'pointer'
                        }}
                            onClick={() => navigate(`/admin/events/${event.id}`)}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {/* Header Status Bar */}
                            <div style={{ height: '6px', backgroundColor: getStatusColor(event.status) }} />

                            <div style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>{event.name}</h3>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: '700',
                                        padding: '2px 8px', borderRadius: '4px',
                                        backgroundColor: `${getStatusColor(event.status)}20`,
                                        color: getStatusColor(event.status),
                                        textTransform: 'uppercase'
                                    }}>
                                        {{
                                            draft: 'Ciornă',
                                            confirmed: 'Confirmat',
                                            in_progress: 'În Desfășurare',
                                            completed: 'Finalizat',
                                            cancelled: 'Anulat'
                                        }[event.status] || event.status}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#4b5563', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={16} style={{ color: '#9ca3af' }} />
                                        <span>
                                            {new Date(event.start_date).toLocaleDateString()}
                                            <span style={{ color: '#9ca3af', margin: '0 4px' }}>•</span>
                                            {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={16} style={{ color: '#9ca3af' }} />
                                        <span>{event.event_halls?.name || 'Fără Salon'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Users size={16} style={{ color: '#9ca3af' }} />
                                        <span>{event.guest_count_expected} Invitați (Est.)</span>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                        {event.type === 'client' ? 'Eveniment Client' : 'Eveniment Restaurant'}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                                            style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminEvents;
