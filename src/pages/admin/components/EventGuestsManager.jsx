
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Trash2, Users, X, UserPlus, ChevronDown, ChevronRight, FileDown, Edit2, Globe, Check, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EventGuestsManager = ({ eventId, allowMinors, readOnly = false }) => {
    const [tables, setTables] = useState([]);
    const [guests, setGuests] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedTables, setExpandedTables] = useState({});
    const [showForm, setShowForm] = useState(null); // tableId or 'unassigned'
    const [editingGuestId, setEditingGuestId] = useState(null);
    const [formData, setFormData] = useState({ full_name: '', type: 'adult', menu_preference: '', notes: '', seat_count: 1 });

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        const [tablesRes, guestsRes, reservationsRes] = await Promise.all([
            supabase.from('event_layout_objects').select('*').eq('event_id', eventId),
            supabase.from('event_guests').select('*').eq('event_id', eventId),
            supabase.from('event_reservations').select('*').eq('event_id', eventId)
        ]);

        // Only show tables and presidium (things with seats)
        const allObjects = tablesRes.data || [];
        const seatObjects = allObjects.filter(o =>
            o.type.includes('table') || o.type === 'presidium'
        );
        setTables(seatObjects);
        setGuests(guestsRes.data || []);
        setReservations(reservationsRes.data || []);

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

    // Consolidated list of everyone at a table (guests + reservations)
    const occupantsForTable = (tableId) => {
        const manualGuests = guests.filter(g => g.layout_object_id === tableId).map(g => ({ ...g, source: 'manual' }));
        const onlineReservations = reservations
            .filter(r => r.table_id?.toString() === tableId?.toString() && r.status !== 'cancelled')
            .map(r => ({
                id: `res-${r.id}`,
                real_id: r.id,
                full_name: r.guest_name,
                seat_count: r.seat_count,
                type: 'adult',
                menu_preference: r.dietary_preference === 'both' ? 'Post & Frupt' : (r.dietary_preference === 'post' ? 'Post' : (r.dietary_preference === 'frupt' ? 'Frupt' : '')),
                notes: r.observations,
                source: 'online',
                status: r.status,
                layout_object_id: tableId
            }));
        return [...manualGuests, ...onlineReservations];
    };

    const unassignedGuests = guests.filter(g => !g.layout_object_id);

    const handleUpdateReservationStatus = async (resId, newStatus) => {
        if (readOnly) return;
        const { error } = await supabase
            .from('event_reservations')
            .update({ status: newStatus })
            .eq('id', resId);

        if (error) {
            alert("Eroare la actualizare: " + error.message);
        } else {
            setReservations(prev => prev.map(r => r.id === resId ? { ...r, status: newStatus } : r));
        }
    };

    const openForm = (tableId, guest = null) => {
        if (guest) {
            setFormData({
                full_name: guest.full_name,
                type: guest.type,
                menu_preference: guest.menu_preference || '',
                notes: guest.notes || '',
                seat_count: guest.seat_count || 1
            });
            setEditingGuestId(guest.id);
            setShowForm(tableId);
        } else {
            setFormData({ full_name: '', type: 'adult', menu_preference: '', notes: '', seat_count: 1 });
            setEditingGuestId(null);
            setShowForm(tableId);
        }
    };

    const closeForm = () => {
        setShowForm(null);
        setEditingGuestId(null);
        setFormData({ full_name: '', type: 'adult', menu_preference: '', notes: '', seat_count: 1 });
    };

    const handleSaveGuest = async (tableId) => {
        if (readOnly) return;
        if (!formData.full_name.trim()) return;

        const seatCount = parseInt(formData.seat_count) || 1;

        // Capacity validation
        if (tableId !== 'unassigned') {
            const table = tables.find(t => t.id === tableId);
            if (table && table.capacity) {
                const occupants = occupantsForTable(tableId);
                const currentTotal = occupants.reduce((sum, occ) => {
                    // If editing a manual guest, don't count their old seat count
                    if (occ.source === 'manual' && editingGuestId && occ.id === editingGuestId) return sum;
                    return sum + (occ.seat_count || 1);
                }, 0);

                if (currentTotal + seatCount > table.capacity) {
                    const confirmExtra = window.confirm(`Atenție! Capacitatea mesei (${table.capacity}) va fi depășită (Total nou: ${currentTotal + seatCount}). Dorești să continui oricum?`);
                    if (!confirmExtra) return;
                }
            }
        }

        const payload = {
            event_id: eventId,
            full_name: formData.full_name.trim(),
            type: formData.type,
            menu_preference: formData.menu_preference || null,
            notes: formData.notes || null,
            layout_object_id: tableId === 'unassigned' ? null : tableId,
            seat_count: seatCount
        };

        if (editingGuestId) {
            const { data, error } = await supabase.from('event_guests').update(payload).eq('id', editingGuestId).select().single();
            if (error) {
                alert("Eroare la actualizare: " + error.message);
            } else {
                setGuests(prev => prev.map(g => g.id === editingGuestId ? data : g));
                closeForm();
            }
        } else {
            const { data, error } = await supabase.from('event_guests').insert([payload]).select().single();
            if (error) {
                alert("Eroare la adăugare: " + error.message);
            } else {
                setGuests(prev => [...prev, data]);
                setFormData({ full_name: '', type: 'adult', menu_preference: '', notes: '', seat_count: 1 });
            }
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
            const tableOccupants = occupantsForTable(table.id);
            if (tableOccupants.length === 0) return;

            // Table Header Title
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59); // #1e293b
            doc.setFont('helvetica', 'bold');
            const totalSeats = tableOccupants.reduce((sum, g) => sum + (g.seat_count || 1), 0);
            doc.text(`${table.type === 'presidium' ? '👑 ' : ''}${table.label} (${totalSeats} persoane)`, 14, currentY);
            currentY += 5;

            const tableData = tableOccupants.map((g, idx) => [
                idx + 1,
                g.full_name + (g.source === 'online' ? ' (Online)' : ''),
                g.seat_count || 1,
                g.type === 'adult' ? 'Adult' : 'Minor',
                g.menu_preference || '-',
                g.notes || '-'
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Nr.', 'Nume Complet', 'Pers.', 'Tip', 'Preferinta Meniu', 'Note / Alergii']],
                body: tableData,
                headStyles: { fillColor: [153, 0, 0], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 15 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 35 },
                    5: { cellWidth: 'auto' }
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

    const totalManualSeats = guests.reduce((sum, g) => sum + (g.seat_count || 1), 0);
    const totalOnlineSeats = reservations.filter(r => r.status !== 'cancelled').reduce((sum, r) => sum + (r.seat_count || 0), 0);
    const totalGuests = totalManualSeats + totalOnlineSeats;

    const adultCount = guests.filter(g => g.type === 'adult').reduce((sum, g) => sum + (g.seat_count || 1), 0) + totalOnlineSeats;
    const minorCount = guests.filter(g => g.type === 'minor').reduce((sum, g) => sum + (g.seat_count || 1), 0);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Se încarcă...</div>;

    // --- ADD/EDIT FORM ---
    const renderAddForm = (tableId) => {
        if (readOnly || showForm !== tableId) return null;
        return (
            <div style={{
                margin: '8px 0', padding: '16px', background: '#f9fafb',
                borderRadius: '10px', border: '1px solid #e5e7eb'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>
                        {editingGuestId ? 'Editează Invitat' : 'Invitat Nou'}
                    </span>
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
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveGuest(tableId); }}
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
                    </div>
                    <div>
                        <label style={labelStyle}>Persoane (total)</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.seat_count}
                            onChange={e => setFormData({ ...formData, seat_count: e.target.value })}
                            style={inputStyle}
                        />
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
                        onClick={() => handleSaveGuest(tableId)}
                        disabled={!formData.full_name.trim()}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none',
                            background: formData.full_name.trim() ? '#111827' : '#d1d5db',
                            color: 'white', cursor: formData.full_name.trim() ? 'pointer' : 'not-allowed',
                            fontWeight: '600', fontSize: '0.85rem'
                        }}
                    >
                        {editingGuestId ? 'Salvează' : 'Adaugă'}
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
            padding: '10px 16px', borderBottom: '1px solid #f3f4f6',
            background: guest.source === 'online' ? '#f0f9ff' : 'transparent'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '500', color: '#111827', minWidth: '160px' }}>{guest.full_name}</span>
                    {guest.source === 'online' && (
                        <span style={{ fontSize: '0.7rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Globe size={10} /> Rezervare Online
                        </span>
                    )}
                </div>

                {guest.source === 'online' ? (
                    <span style={{
                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
                        background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a'
                    }}>
                        {guest.seat_count} pers.
                    </span>
                ) : (
                    guest.seat_count > 1 && (
                        <span style={{
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
                            background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a'
                        }}>
                            + {guest.seat_count - 1} pers.
                        </span>
                    )
                )}
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
                {guest.source === 'online' && (
                    <span style={{
                        padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                        background: guest.status === 'confirmed' ? '#dcfce7' : (guest.status === 'pending' ? '#fef9c3' : '#fee2e2'),
                        color: guest.status === 'confirmed' ? '#166534' : (guest.status === 'pending' ? '#854d0e' : '#991b1b'),
                        border: `1px solid ${guest.status === 'confirmed' ? '#bbf7d0' : (guest.status === 'pending' ? '#fef08a' : '#fecaca')}`
                    }}>
                        {guest.status.toUpperCase()}
                    </span>
                )}
            </div>
            {!readOnly && (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {guest.source === 'online' ? (
                        <>
                            {guest.status === 'pending' && (
                                <button
                                    onClick={() => handleUpdateReservationStatus(guest.real_id, 'confirmed')}
                                    style={{ border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                                    title="Confirmă"
                                >
                                    <Check size={14} /> Confirmă
                                </button>
                            )}
                            {guest.status !== 'cancelled' && (
                                <button
                                    onClick={() => handleUpdateReservationStatus(guest.real_id, 'cancelled')}
                                    style={{ border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                                    title="Anulează"
                                >
                                    <AlertCircle size="14" /> Anulează
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => openForm(guest.layout_object_id || 'unassigned', guest)}
                                style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                                title="Editează"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteGuest(guest.id)}
                                style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                title="Șterge"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    // --- TABLE SECTION ---
    const renderTableSection = (table) => {
        const tableOccupants = occupantsForTable(table.id);
        const isExpanded = expandedTables[table.id];
        const currentOccupancy = tableOccupants.reduce((sum, g) => sum + (g.seat_count || 1), 0);
        const isFull = currentOccupancy >= (table.capacity || 999);

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
                            background: isFull ? '#fee2e2' : (currentOccupancy > 6 ? '#fef9c3' : '#f0fdf4'),
                            color: isFull ? '#991b1b' : (currentOccupancy > 6 ? '#854d0e' : '#166534'),
                            fontWeight: '600',
                            border: `1px solid ${isFull ? '#fecaca' : (currentOccupancy > 6 ? '#fef08a' : '#bbf7d0')}`
                        }}>
                            {currentOccupancy} / {table.capacity || '∞'}
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
                        {tableOccupants.length > 0 ? (
                            tableOccupants.map(renderGuestRow)
                        ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                                Niciun invitat alocat acestei mese.
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
