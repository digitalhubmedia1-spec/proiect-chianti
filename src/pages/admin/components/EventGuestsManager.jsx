
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Trash2, Users, X, UserPlus, ChevronDown, ChevronRight } from 'lucide-react';

const EventGuestsManager = ({ eventId, allowMinors }) => {
    const [tables, setTables] = useState([]);
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedTables, setExpandedTables] = useState({});
    const [showForm, setShowForm] = useState(null); // tableId or 'unassigned'
    const [formData, setFormData] = useState({ full_name: '', type: 'adult', menu_preference: '', notes: '' });

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        const [tablesRes, guestsRes] = await Promise.all([
            supabase.from('event_layout_objects').select('*').eq('event_id', eventId),
            supabase.from('event_guests').select('*').eq('event_id', eventId)
        ]);

        // Only show tables and presidium (things with seats)
        const allObjects = tablesRes.data || [];
        const seatObjects = allObjects.filter(o =>
            o.type.includes('table') || o.type === 'presidium'
        );
        setTables(seatObjects);
        setGuests(guestsRes.data || []);

        // Expand all tables by default
        const expanded = {};
        seatObjects.forEach(t => { expanded[t.id] = true; });
        expanded['unassigned'] = true;
        setExpandedTables(expanded);

        setLoading(false);
    };

    const toggleTable = (tableId) => {
        setExpandedTables(prev => ({ ...prev, [tableId]: !prev[tableId] }));
    };

    const guestsForTable = (tableId) => guests.filter(g => g.layout_object_id === tableId);
    const unassignedGuests = guests.filter(g => !g.layout_object_id);

    const openForm = (tableId) => {
        setFormData({ full_name: '', type: 'adult', menu_preference: '', notes: '' });
        setShowForm(tableId);
    };

    const closeForm = () => {
        setShowForm(null);
        setFormData({ full_name: '', type: 'adult', menu_preference: '', notes: '' });
    };

    const handleAddGuest = async (tableId) => {
        if (!formData.full_name.trim()) return;

        const payload = {
            event_id: eventId,
            full_name: formData.full_name.trim(),
            type: formData.type,
            menu_preference: formData.menu_preference || null,
            notes: formData.notes || null,
            layout_object_id: tableId === 'unassigned' ? null : tableId
        };

        const { data, error } = await supabase.from('event_guests').insert([payload]).select().single();

        if (error) {
            alert("Eroare: " + error.message);
        } else {
            setGuests(prev => [...prev, data]);
            // Reset form but keep it open for batch adding
            setFormData({ full_name: '', type: 'adult', menu_preference: '', notes: '' });
        }
    };

    const handleDeleteGuest = async (guestId) => {
        if (!window.confirm("Ștergi acest invitat?")) return;
        await supabase.from('event_guests').delete().eq('id', guestId);
        setGuests(prev => prev.filter(g => g.id !== guestId));
    };

    const totalGuests = guests.length;
    const adultCount = guests.filter(g => g.type === 'adult').length;
    const minorCount = guests.filter(g => g.type === 'minor').length;

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Se încarcă...</div>;

    // --- INLINE ADD FORM ---
    const renderAddForm = (tableId) => {
        if (showForm !== tableId) return null;
        return (
            <div style={{
                margin: '8px 0', padding: '16px', background: '#f9fafb',
                borderRadius: '10px', border: '1px solid #e5e7eb'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Invitat Nou</span>
                    <button onClick={closeForm} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af' }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Nume Complet *</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Ex: Ion Popescu"
                            style={inputStyle}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleAddGuest(tableId); }}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Tip</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="adult">Adult</option>
                            {allowMinors && <option value="minor">Minor</option>}
                        </select>
                        {!allowMinors && (
                            <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
                                Minorii nu sunt permiși la acest eveniment
                            </p>
                        )}
                    </div>
                    <div>
                        <label style={labelStyle}>Preferință Meniu</label>
                        <select
                            value={formData.menu_preference}
                            onChange={e => setFormData({ ...formData, menu_preference: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">Standard</option>
                            <option value="post">Post</option>
                            <option value="frupt">Frupt</option>
                            <option value="vegetarian">Vegetarian</option>
                            <option value="vegan">Vegan</option>
                            <option value="special">Special</option>
                        </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Observații (alergii, etc.)</label>
                        <input
                            type="text"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Opțional"
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                        onClick={() => handleAddGuest(tableId)}
                        disabled={!formData.full_name.trim()}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none',
                            background: formData.full_name.trim() ? '#111827' : '#d1d5db',
                            color: 'white', cursor: formData.full_name.trim() ? 'pointer' : 'not-allowed',
                            fontWeight: '600', fontSize: '0.85rem'
                        }}
                    >
                        Adaugă
                    </button>
                    <button onClick={closeForm} style={{
                        padding: '8px 16px', borderRadius: '6px',
                        border: '1px solid #e5e7eb', background: 'white',
                        cursor: 'pointer', fontSize: '0.85rem', color: '#6b7280'
                    }}>
                        Anulează
                    </button>
                </div>
            </div>
        );
    };

    // --- GUEST ROW ---
    const renderGuestRow = (guest) => (
        <div key={guest.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderBottom: '1px solid #f3f4f6'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <span style={{ fontWeight: '500', color: '#111827', minWidth: '160px' }}>{guest.full_name}</span>
                <span style={{
                    padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                    background: guest.type === 'adult' ? '#dbeafe' : '#fce7f3',
                    color: guest.type === 'adult' ? '#1e40af' : '#be185d'
                }}>
                    {guest.type === 'adult' ? 'Adult' : 'Minor'}
                </span>
                {guest.menu_preference && (
                    <span style={{
                        padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem',
                        background: '#f0fdf4', color: '#166534', fontWeight: '500'
                    }}>
                        {guest.menu_preference}
                    </span>
                )}
                {guest.notes && (
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>
                        {guest.notes}
                    </span>
                )}
            </div>
            <button
                onClick={() => handleDeleteGuest(guest.id)}
                style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );

    // --- TABLE SECTION ---
    const renderTableSection = (table) => {
        const tableGuests = guestsForTable(table.id);
        const isExpanded = expandedTables[table.id];
        const isFull = tableGuests.length >= (table.capacity || 999);

        return (
            <div key={table.id} style={{
                background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb',
                overflow: 'hidden', marginBottom: '12px'
            }}>
                {/* Table Header */}
                <div
                    onClick={() => toggleTable(table.id)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', cursor: 'pointer',
                        background: table.type === 'presidium' ? '#fffbeb' : '#f9fafb',
                        borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isExpanded ? <ChevronDown size={18} color="#6b7280" /> : <ChevronRight size={18} color="#6b7280" />}
                        <span style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>
                            {table.type === 'presidium' ? '👑 ' : ''}{table.label}
                        </span>
                        <span style={{
                            padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem',
                            background: isFull ? '#fee2e2' : '#f0fdf4',
                            color: isFull ? '#991b1b' : '#166534', fontWeight: '600'
                        }}>
                            {tableGuests.length} / {table.capacity || '∞'}
                        </span>
                    </div>
                    {!isFull && (
                        <button
                            onClick={(e) => { e.stopPropagation(); openForm(table.id); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '6px 12px', borderRadius: '6px',
                                border: '1px solid #e5e7eb', background: 'white',
                                cursor: 'pointer', fontSize: '0.8rem', color: '#374151', fontWeight: '500'
                            }}
                        >
                            <UserPlus size={14} /> Adaugă
                        </button>
                    )}
                </div>

                {/* Guests List */}
                {isExpanded && (
                    <div>
                        {tableGuests.map(renderGuestRow)}
                        {tableGuests.length === 0 && showForm !== table.id && (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                                Niciun invitat la această masă
                            </div>
                        )}
                        {renderAddForm(table.id)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            {/* Summary Bar */}
            <div style={{
                display: 'flex', gap: '16px', marginBottom: '20px', padding: '16px',
                background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} color="#6b7280" />
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total:</span>
                    <strong style={{ fontSize: '1.1rem' }}>{totalGuests}</strong>
                </div>
                <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', background: '#dbeafe', color: '#1e40af', fontWeight: '600' }}>
                        {adultCount} Adulți
                    </span>
                    {allowMinors && (
                        <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', background: '#fce7f3', color: '#be185d', fontWeight: '600' }}>
                            {minorCount} Minori
                        </span>
                    )}
                </div>
                <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        Neasignați: <strong style={{ color: unassignedGuests.length > 0 ? '#dc2626' : '#16a34a' }}>{unassignedGuests.length}</strong>
                    </span>
                </div>
            </div>

            {tables.length === 0 && (
                <div style={{
                    padding: '2rem', textAlign: 'center', background: '#fffbeb',
                    borderRadius: '10px', border: '1px solid #fde68a', marginBottom: '16px'
                }}>
                    <p style={{ color: '#92400e', fontWeight: '600' }}>Nu există mese definite în planul de sală.</p>
                    <p style={{ color: '#a16207', fontSize: '0.85rem', marginTop: '4px' }}>
                        Adăugați mai întâi mese în tab-ul "Plan Sală", apoi reveniți aici.
                    </p>
                </div>
            )}

            {/* Tables Sections */}
            {tables.map(renderTableSection)}

            {/* Unassigned Guests Section */}
            <div style={{
                background: 'white', borderRadius: '10px', border: '1px dashed #d1d5db',
                overflow: 'hidden', marginTop: '12px'
            }}>
                <div
                    onClick={() => toggleTable('unassigned')}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', cursor: 'pointer', background: '#fafafa',
                        borderBottom: expandedTables['unassigned'] ? '1px solid #e5e7eb' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {expandedTables['unassigned'] ? <ChevronDown size={18} color="#6b7280" /> : <ChevronRight size={18} color="#6b7280" />}
                        <span style={{ fontWeight: '700', color: '#6b7280', fontSize: '0.95rem' }}>
                            Fără masă asignată
                        </span>
                        <span style={{
                            padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem',
                            background: '#f3f4f6', color: '#6b7280', fontWeight: '600'
                        }}>
                            {unassignedGuests.length}
                        </span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); openForm('unassigned'); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '6px 12px', borderRadius: '6px',
                            border: '1px solid #e5e7eb', background: 'white',
                            cursor: 'pointer', fontSize: '0.8rem', color: '#374151', fontWeight: '500'
                        }}
                    >
                        <UserPlus size={14} /> Adaugă
                    </button>
                </div>

                {expandedTables['unassigned'] && (
                    <div>
                        {unassignedGuests.map(renderGuestRow)}
                        {unassignedGuests.length === 0 && showForm !== 'unassigned' && (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                                Toți invitații sunt asignați la mese
                            </div>
                        )}
                        {renderAddForm('unassigned')}
                    </div>
                )}
            </div>
        </div>
    );
};

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '4px' };
const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: '6px',
    border: '1px solid #e5e7eb', fontSize: '0.85rem', outline: 'none',
    boxSizing: 'border-box'
};

export default EventGuestsManager;
