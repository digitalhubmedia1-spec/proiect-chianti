
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Trash2, Users, X, UserPlus, ChevronDown, ChevronRight, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EventGuestsManager = ({ eventId, allowMinors, readOnly = false }) => {
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
        if (readOnly) return;
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
        if (readOnly) return;
        if (!window.confirm("Ștergi acest invitat?")) return;
        await supabase.from('event_guests').delete().eq('id', guestId);
        setGuests(prev => prev.filter(g => g.id !== guestId));
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString('ro-RO');

        // Header
        doc.setFontSize(18);
        doc.setTextColor(153, 0, 0); // #990000
        doc.text('Lista Invitati pe Mese', 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // #64748b
        doc.text(`Data export: ${dateStr}`, 14, 28);

        let currentY = 35;

        // Render each table
        tables.forEach((table, index) => {
            const tableGuests = guestsForTable(table.id);
            if (tableGuests.length === 0) return;

            // Table Header Title
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59); // #1e293b
            doc.setFont('helvetica', 'bold');
            doc.text(`${table.type === 'presidium' ? '👑 ' : ''}${table.label} (${tableGuests.length} invitati)`, 14, currentY);
            currentY += 5;

            const tableData = tableGuests.map((g, idx) => [
                idx + 1,
                g.full_name,
                g.type === 'adult' ? 'Adult' : 'Minor',
                g.menu_preference || '-',
                g.notes || '-'
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Nr.', 'Nume Complet', 'Tip', 'Preferinta Meniu', 'Note / Alergii']],
                body: tableData,
                headStyles: { fillColor: [153, 0, 0], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 'auto' }
                },
                margin: { left: 14, right: 14 }
            });

            currentY = doc.lastAutoTable.finalY + 15;

            // Check for page break
            if (currentY > 250 && index < tables.length - 1) {
                doc.addPage();
                currentY = 20;
            }
        });

        // Unassigned guests
        if (unassignedGuests.length > 0) {
            if (currentY > 230) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.text(`Invitati Nealocati (${unassignedGuests.length})`, 14, currentY);
            currentY += 5;

            const unassignedData = unassignedGuests.map((g, idx) => [
                idx + 1,
                g.full_name,
                g.type === 'adult' ? 'Adult' : 'Minor',
                g.menu_preference || '-',
                g.notes || '-'
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Nr.', 'Nume Complet', 'Tip', 'Preferinta Meniu', 'Note / Alergii']],
                body: unassignedData,
                headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 'auto' }
                },
                margin: { left: 14, right: 14 }
            });
        }

        doc.save(`Lista_Invitati_Eveniment_${eventId}.pdf`);
    };

    const totalGuests = guests.length;
    const adultCount = guests.filter(g => g.type === 'adult').length;
    const minorCount = guests.filter(g => g.type === 'minor').length;

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Se încarcă...</div>;

    // --- INLINE ADD FORM ---
    const renderAddForm = (tableId) => {
        if (readOnly || showForm !== tableId) return null;
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
            {!readOnly && (
                <button
                    onClick={() => handleDeleteGuest(guest.id)}
                    style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                >
                    <Trash2 size={16} />
                </button>
            )}
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
                    {!isFull && !readOnly && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={20} color="#990000" />
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{totalGuests}</span>
                        <span style={{ color: '#64748b' }}>Total</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>{adultCount}</span>
                        <span style={{ color: '#64748b' }}>Adulți</span>
                    </div>
                    {allowMinors && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{minorCount}</span>
                            <span style={{ color: '#64748b' }}>Minori</span>
                        </div>
                    )}
                </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleExportPDF}
                            disabled={guests.length === 0}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 18px', borderRadius: '8px',
                                background: guests.length === 0 ? '#cbd5e1' : '#990000',
                                color: 'white', border: 'none', fontWeight: '600',
                                cursor: guests.length === 0 ? 'not-allowed' : 'pointer',
                                boxShadow: '0 2px 4px rgba(153,0,0,0.2)'
                            }}
                        >
                            <FileDown size={18} /> Export PDF Mese
                        </button>

                        {!readOnly && (
                            <button
                                onClick={() => openForm('unassigned')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 18px', borderRadius: '8px',
                                    background: 'white', color: '#1e293b',
                                    border: '1px solid #cbd5e1', fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <UserPlus size={18} /> Adaugă Invitat
                            </button>
                        )}
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
