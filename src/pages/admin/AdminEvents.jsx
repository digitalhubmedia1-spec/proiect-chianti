
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Calendar, MapPin, Users, Trash2, CheckCircle, AlertCircle, ArrowLeft, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Auth Check
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const adminRole = localStorage.getItem('admin_role');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token || !adminRole) {
            setIsAuthenticated(false);
        }
    }, [adminRole]);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchEvents();
    }, [isAuthenticated]);

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

    const handleDuplicate = async (originalId) => {
        try {
            setLoading(true);
            
            // 1. Fetch original event
            const { data: event, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', originalId)
                .single();

            if (eventError) throw eventError;

            // 2. Prepare new event data
            const { id, created_at, updated_at, reservation_token, access_token, ...rest } = event;
            const newEventData = {
                ...rest,
                name: `${event.name} (copie)`,
                status: 'draft',
                // reservation_token is intentionally omitted (will be null)
                // access_token will be auto-generated if it has a default in DB, or we can omit it
            };

            // 3. Insert new event
            const { data: newEvent, error: insertError } = await supabase
                .from('events')
                .insert([newEventData])
                .select()
                .single();

            if (insertError) throw insertError;
            const newId = newEvent.id;

            // 4. Duplicate related tables
            const tablesToDuplicate = [
                'event_layout_objects',
                'event_staff_assignments',
                'event_timeline_items',
                'event_gallery'
            ];

            for (const table of tablesToDuplicate) {
                const { data: records, error: fetchError } = await supabase
                    .from(table)
                    .select('*')
                    .eq('event_id', originalId);

                if (fetchError) {
                    console.error(`Error fetching from ${table}:`, fetchError);
                    continue;
                }

                if (records && records.length > 0) {
                    const newRecords = records.map(r => {
                        const { id, created_at, event_id, ...recordRest } = r;
                        return { ...recordRest, event_id: newId };
                    });

                    const { error: batchInsertError } = await supabase
                        .from(table)
                        .insert(newRecords);

                    if (batchInsertError) {
                        console.error(`Error inserting into ${table}:`, batchInsertError);
                    }
                }
            }

            // 5. Duplicate Menu Packages & Items (special handling for package_id)
            const { data: packages, error: packagesError } = await supabase
                .from('event_menu_packages')
                .select('*')
                .eq('event_id', originalId);

            if (packages && packages.length > 0) {
                const packageIdMap = {};
                for (const pkg of packages) {
                    const { id: oldPackageId, created_at, event_id, ...pkgRest } = pkg;
                    const { data: newPkg, error: newPkgError } = await supabase
                        .from('event_menu_packages')
                        .insert([{ ...pkgRest, event_id: newId }])
                        .select()
                        .single();
                    
                    if (newPkg) {
                        packageIdMap[oldPackageId] = newPkg.id;
                    }
                }

                // Now duplicate menu items and link to new packages
                const { data: items, error: itemsError } = await supabase
                    .from('event_menu_items')
                    .select('*')
                    .eq('event_id', originalId);

                if (items && items.length > 0) {
                    const newItems = items.map(item => {
                        const { id, created_at, event_id, ...itemRest } = item;
                        return { 
                            ...itemRest, 
                            event_id: newId, 
                            package_id: item.package_id ? packageIdMap[item.package_id] : null 
                        };
                    });

                    await supabase.from('event_menu_items').insert(newItems);
                }
            } else {
                // If no packages, just try duplicating items (if any exist without a package)
                const { data: items, error: itemsError } = await supabase
                    .from('event_menu_items')
                    .select('*')
                    .eq('event_id', originalId);

                if (items && items.length > 0) {
                    const newItems = items.map(item => {
                        const { id, created_at, event_id, ...itemRest } = item;
                        return { ...itemRest, event_id: newId };
                    });
                    await supabase.from('event_menu_items').insert(newItems);
                }
            }

            alert('Eveniment duplicat cu succes!');
            fetchEvents();
        } catch (error) {
            console.error('Error duplicating event:', error);
            alert('Eroare la duplicare: ' + error.message);
        } finally {
            setLoading(false);
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

    if (!isAuthenticated) {
        return (
            <div style={{ 
                height: '100vh', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: '#f8fafc',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{ 
                    background: 'white', 
                    padding: '3rem', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    maxWidth: '400px'
                }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        background: '#fee2e2', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <Calendar size={32} color="#dc2626" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' }}>
                        Acces Restricționat
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.5' }}>
                        Trebuie să fii autentificat în panoul de administrare pentru a accesa secțiunea de Evenimente.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/admin/login'}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: '#990000',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        Mergi la Autentificare
                    </button>
                </div>
            </div>
        );
    }

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
                                            onClick={(e) => { e.stopPropagation(); handleDuplicate(event.id); }}
                                            style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#f3f4f6', color: '#4b5563', cursor: 'pointer' }}
                                            title="Duplică eveniment"
                                        >
                                            <Copy size={16} />
                                        </button>
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
