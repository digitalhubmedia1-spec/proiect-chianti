
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Save, Users, Map, FileText, Settings, ChefHat, Image } from 'lucide-react';
import VisualHallEditor from './components/VisualHallEditor';
import EventMenuPlanner from './components/EventMenuPlanner';
import EventProduction from './components/EventProduction';
import EventOperations from './components/EventOperations';
import EventGuestsManager from './components/EventGuestsManager';
import EventReservations from './components/EventReservations';
import EventSettingsMedia from './components/EventSettingsMedia';

const AdminEventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // general, layout, guests, menu, production
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id === 'new') {
            setEvent({
                name: '',
                start_date: new Date().toISOString().slice(0, 16),
                end_date: new Date().toISOString().slice(0, 16),
                type: 'client',
                status: 'draft',
                guest_count_expected: 0
            });
            setLoading(false);
        } else {
            loadEvent();
        }
    }, [id]);

    const loadEvent = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*, event_halls(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setEvent(data);
        } catch (err) {
            console.error(err);
            alert("Eroare la incarcarea evenimentului");
            navigate('/admin/events');
        } finally {
            setLoading(false);
        }
    };



    const handleSave = async () => {
        try {
            const payload = {
                name: event.name,
                start_date: event.start_date,
                end_date: event.end_date,
                type: event.type,
                status: event.status,
                guest_count_expected: event.guest_count_expected,
                hall_id: event.hall_id,
                allow_minors: event.allow_minors,
                client_name: event.client_name,
                client_phone: event.client_phone,
                client_email: event.client_email,
                deposit_amount: event.deposit_amount
            };

            if (id === 'new') {
                const { data, error } = await supabase.from('events').insert([payload]).select().single();
                if (error) throw error;
                navigate(`/admin/events/${data.id}`);
            } else {
                const { error } = await supabase.from('events').update(payload).eq('id', id);
                if (error) throw error;
                alert('Salvat cu succes!');
            }
        } catch (err) {
            alert("Eroare: " + err.message);
        }
    };

    // --- RESERVATION LINK ---
    const generateReservationLink = async () => {
        if (!event.id) return;
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const { error } = await supabase.from('events').update({ reservation_token: token }).eq('id', event.id);
        if (error) alert('Eroare: ' + error.message);
        else {
            setEvent({ ...event, reservation_token: token });
            alert('Link generat cu succes!');
        }
    };

    const copyReservationLink = () => {
        const url = `${window.location.origin}/rezervare/${event.reservation_token}`;
        navigator.clipboard.writeText(url);
        alert('Link copiat in clipboard!');
    };

    // --- TABS RENDER ---
    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '800px' }}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Nume Eveniment</label>
                            <input
                                type="text"
                                value={event.name}
                                onChange={e => setEvent({ ...event, name: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Data Start</label>
                                <input
                                    type="datetime-local"
                                    value={event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : ''}
                                    onChange={e => setEvent({ ...event, start_date: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Data Sfarsit</label>
                                <input
                                    type="datetime-local"
                                    value={event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : ''}
                                    onChange={e => setEvent({ ...event, end_date: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>
                        {/* Type & Minors */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Tip Eveniment</label>
                                <select
                                    value={event.type}
                                    onChange={e => setEvent({ ...event, type: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="client">Eveniment Client</option>
                                    <option value="restaurant">Eveniment Restaurant</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '25px' }}>
                                <input
                                    type="checkbox"
                                    id="allow_minors"
                                    checked={event.allow_minors || false}
                                    onChange={e => setEvent({ ...event, allow_minors: e.target.checked })}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <label htmlFor="allow_minors" style={{ cursor: 'pointer' }}>Permite Minori</label>
                            </div>
                        </div>

                        {/* Client Details (Only if Client Event) */}
                        {event.type === 'client' && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>Detalii Client</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input
                                        placeholder="Nume Client"
                                        value={event.client_name || ''}
                                        onChange={e => setEvent({ ...event, client_name: e.target.value })}
                                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                    <input
                                        placeholder="Telefon"
                                        value={event.client_phone || ''}
                                        onChange={e => setEvent({ ...event, client_phone: e.target.value })}
                                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                    <input
                                        placeholder="Email"
                                        value={event.client_email || ''}
                                        onChange={e => setEvent({ ...event, client_email: e.target.value })}
                                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', gridColumn: 'span 2' }}
                                    />
                                </div>
                                {event.access_token && (
                                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#6b7280' }}>
                                        <strong>Link Portal:</strong> {window.location.origin}/portal/{event.access_token}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Financials */}
                        <div style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>Avans (RON)</label>
                                <input
                                    type="number"
                                    value={event.deposit_amount || 0}
                                    onChange={e => setEvent({ ...event, deposit_amount: parseFloat(e.target.value) })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>

                        {/* Hall Selector (Simple for now) */}
                        <div style={{ marginTop: '1rem' }}>
                            <label>Salon</label>
                            <select
                                value={event.hall_id || ''}
                                onChange={e => setEvent({ ...event, hall_id: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                <option value="">Selectează Salon</option>
                                <option value="1">Salon Florența</option>
                                <option value="2">Salon Veneția</option>
                                <option value="3">Salon Roma</option>
                            </select>
                        </div>

                        {/* Reservation Link */}
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: '#166534' }}>Rezervări Online</h3>
                            <p style={{ fontSize: '0.9rem', color: '#15803d', marginBottom: '1rem' }}>
                                Trimiteți acest link invitaților pentru a se înscrie singuri la mese.
                            </p>
                            {event.reservation_token ? (
                                <div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                        <input 
                                            readOnly 
                                            value={`${window.location.origin}/rezervare/${event.reservation_token}`} 
                                            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #16a34a', background: 'white', color: '#166534', fontWeight: '500' }}
                                        />
                                        <button onClick={copyReservationLink} style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                            Copiază
                                        </button>
                                    </div>
                                    <button onClick={generateReservationLink} style={{ fontSize: '0.85rem', color: '#166534', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                        Regenerează Link
                                    </button>
                                </div>
                            ) : (
                                <button onClick={generateReservationLink} style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                    Generează Link Rezervare
                                </button>
                            )}
                        </div>
                    </div>
                );
            case 'layout':
                return (
                    event.hall_id ? (
                        <VisualHallEditor eventId={id} hallId={event.hall_id} />
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>Vă rugăm să selectați un salon în tab-ul General mai întâi.</div>
                    )
                );
            case 'guests':
                return <EventGuestsManager eventId={id} allowMinors={event.allow_minors || false} />;
            case 'menu':
                return <EventMenuPlanner eventId={id} />;
            case 'production':
                return <EventProduction eventId={id} />;
            case 'operations':
                return <EventOperations eventId={id} eventStatus={event.status} onUpdateStatus={(s) => setEvent({ ...event, status: s })} />;
            case 'reservations':
                return <EventReservations eventId={id} />;
            case 'media':
                return <EventSettingsMedia eventId={id} event={event} onUpdateEvent={setEvent} />;
            default: return null;
        }
    };

    if (loading || !event) return <div>Incarcare...</div>;

    return (
        <div style={{ padding: '2rem', background: '#f3f4f6', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/admin/events')} style={{ border: 'none', background: 'transprent', cursor: 'pointer' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{event.name || 'Eveniment Nou'}</h1>
                    <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
                        background: event.status === 'confirmed' ? '#dbeafe' : event.status === 'completed' ? '#d1fae5' : '#fef3c7',
                        color: event.status === 'confirmed' ? '#1e40af' : event.status === 'completed' ? '#065f46' : '#92400e'
                    }}>
                        {{
                            draft: 'CIORNĂ',
                            confirmed: 'CONFIRMAT',
                            in_progress: 'ÎN DESFĂȘURARE',
                            completed: 'FINALIZAT',
                            cancelled: 'ANULAT'
                        }[event.status] || event.status.toUpperCase()}
                    </span>
                </div>
                <button
                    onClick={handleSave}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#111827', color: 'white', border: 'none',
                        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer'
                    }}
                >
                    <Save size={18} /> Salvează
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                {[
                    { id: 'general', label: 'General', icon: Settings },
                    { id: 'layout', label: 'Plan Sala', icon: Map },
                    { id: 'guests', label: 'Invitati', icon: Users },
                    { id: 'menu', label: 'Meniu', icon: FileText },
                    { id: 'production', label: 'Productie', icon: ChefHat },
                    { id: 'operations', label: 'Operațional', icon: Settings },
                    { id: 'reservations', label: 'Rezervări', icon: Users },
                    { id: 'media', label: 'Media & Setări', icon: Image },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        disabled={id === 'new' && tab.id !== 'general'}
                        title={id === 'new' && tab.id !== 'general' ? 'Salvați evenimentul mai întâi' : ''}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: activeTab === tab.id ? 'white' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid #111827' : '2px solid transparent',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            color: activeTab === tab.id ? '#111827' : '#6b7280',
                            fontWeight: '600'
                        }}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {renderTabContent()}
        </div>
    );
};

export default AdminEventDetail;
