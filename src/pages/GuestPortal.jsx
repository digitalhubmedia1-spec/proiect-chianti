
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Users, MapPin, Calendar, Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import VisualHallEditor from './admin/components/VisualHallEditor';

const GuestPortal = () => {
    const { token } = useParams();
    const [event, setEvent] = useState(null);
    const [guests, setGuests] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form State
    const [newGuestName, setNewGuestName] = useState('');
    const [newGuestType, setNewGuestType] = useState('adult');
    const [newGuestDiet, setNewGuestDiet] = useState('standard');
    const [newGuestTable, setNewGuestTable] = useState('');

    useEffect(() => {
        fetchEventData();
    }, [token]);

    const fetchEventData = async () => {
        try {
            setLoading(true);
            // 1. Get Event by Token
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*, event_halls(name)')
                .eq('access_token', token)
                .single();

            if (eventError || !eventData) throw new Error("Evenimentul nu a fost găsit sau link-ul a expirat.");
            setEvent(eventData);

            // 2. Get Tables/Layout for this event
            const { data: tableData } = await supabase
                .from('event_layout_objects')
                .select('*')
                .eq('event_id', eventData.id)
                .in('type', ['table_round_12', 'table_round_8', 'table_rect_6', 'table_rect_4', 'presidium']);
            setTables(tableData || []);

            // 3. Get Existing Guests
            const { data: guestData } = await supabase
                .from('event_guests')
                .select('*')
                .eq('event_id', eventData.id);
            setGuests(guestData || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGuest = async (e) => {
        e.preventDefault();
        if (!newGuestName.trim()) return;

        try {
            const newGuest = {
                event_id: event.id,
                full_name: newGuestName,
                type: newGuestType,
                dietary_pref: newGuestDiet,
                layout_object_id: newGuestTable || null
            };

            const { data, error } = await supabase.from('event_guests').insert([newGuest]).select().single();
            if (error) throw error;

            setGuests([...guests, data]);
            setNewGuestName('');
            setNewGuestDiet('standard');
            setNewGuestTable('');
        } catch (err) {
            alert("Eroare la adăugare: " + err.message);
        }
    };

    const handleDeleteGuest = async (id) => {
        if (!window.confirm("Ștergeți acest invitat?")) return;

        const { error } = await supabase.from('event_guests').delete().eq('id', id);
        if (!error) {
            setGuests(guests.filter(g => g.id !== id));
        }
    };

    const getTableLabel = (id) => {
        const t = tables.find(t => t.id === parseInt(id));
        return t ? t.label : 'Necunoscut';
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Se încarcă detaliile evenimentului...</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>A apărut o eroare: {error}</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h1 style={{ color: '#990000', marginBottom: '0.5rem' }}>{event.name}</h1>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', color: '#555', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={16} />
                        {new Date(event.start_date).toLocaleDateString()} {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={16} /> {event.event_halls?.name}
                    </div>
                </div>
            </div>

            {/* Configurare Invitati */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Adaugă Invitat
                </h2>

                <form onSubmit={handleAddGuest} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#666' }}>Nume Complet</label>
                        <input
                            value={newGuestName}
                            onChange={e => setNewGuestName(e.target.value)}
                            placeholder="ex: Ion Popescu"
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#666' }}>Tip</label>
                        <select
                            value={newGuestType}
                            onChange={e => setNewGuestType(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        >
                            <option value="adult">Adult</option>
                            <option value="child">Copil</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#666' }}>Meniu / Dietă</label>
                        <select
                            value={newGuestDiet}
                            onChange={e => setNewGuestDiet(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        >
                            <option value="standard">Standard</option>
                            <option value="vegetarian">Vegetarian</option>
                            <option value="vegan">Vegan (Post)</option>
                            <option value="pescatarian">Pescatarian</option>
                            <option value="allergy_gluten">Fără Gluten</option>
                            <option value="allergy_lactose">Fără Lactoză</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#666' }}>Masa (Opțional)</label>
                        <select
                            value={newGuestTable}
                            onChange={e => setNewGuestTable(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        >
                            <option value="">- Alege Masa -</option>
                            {tables.map(t => (
                                <option key={t.id} value={t.id}>{t.label} ({t.type.includes('12') ? '12' : t.type.includes('8') ? '8' : t.type.includes('6') ? '6' : '4'} loc)</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        style={{
                            background: '#990000', color: 'white', border: 'none',
                            padding: '10px', borderRadius: '6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            fontWeight: '600'
                        }}
                    >
                        <Plus size={18} /> Adaugă
                    </button>
                </form>
            </div>

            {/* Lista Invitati */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>Lista Invitați ({guests.length})</h3>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        Adulți: {guests.filter(g => g.type === 'adult').length} • Copii: {guests.filter(g => g.type === 'child').length}
                    </span>
                </div>

                {guests.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Nu aveți niciun invitat adăugat încă.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#f3f4f6', color: '#4b5563', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '12px' }}>Nume</th>
                                <th style={{ padding: '12px' }}>Tip</th>
                                <th style={{ padding: '12px' }}>Meniu</th>
                                <th style={{ padding: '12px' }}>Masa</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {guests.map(guest => (
                                <tr key={guest.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{guest.full_name}</td>
                                    <td style={{ padding: '12px' }}>
                                        {guest.type === 'adult' ? 'Adult' : 'Copil'}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem',
                                            background: guest.dietary_pref === 'standard' ? '#e5e7eb' : '#dcfce7',
                                            color: guest.dietary_pref === 'standard' ? '#374151' : '#166534'
                                        }}>
                                            {guest.dietary_pref === 'standard' ? 'Standard' : guest.dietary_pref}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {guest.layout_object_id ? getTableLabel(guest.layout_object_id) : <span style={{ color: '#999' }}>-</span>}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDeleteGuest(guest.id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Plan Sala */}
            {event.hall_id && (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '2rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        Plan Sală
                    </h2>
                    <VisualHallEditor eventId={event.id} hallId={event.hall_id} readOnly={true} />
                </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>
                <p>Chianti Event Management System</p>
            </div>
        </div>
    );
};

export default GuestPortal;
