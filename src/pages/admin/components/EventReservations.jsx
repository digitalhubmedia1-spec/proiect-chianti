import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Download, Search, Filter, Trash2, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const EventReservations = ({ eventId }) => {
    const [reservations, setReservations] = useState([]);
    const [tables, setTables] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchReservations();
        
        // Realtime subscription
        const subscription = supabase
            .channel('public:event_reservations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_reservations', filter: `event_id=eq.${eventId}` }, (payload) => {
                fetchReservations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [eventId]);

    const fetchReservations = async () => {
        setLoading(true);
        
        // Fetch reservations
        const { data: resData, error: resError } = await supabase
            .from('event_reservations')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });
        
        if (resError) {
            console.error(resError);
            setLoading(false);
            return;
        }

        // Fetch tables (layout objects) to get labels
        const { data: tablesData, error: tablesError } = await supabase
            .from('event_layout_objects')
            .select('id, label')
            .eq('event_id', eventId);

        if (tablesData) {
            const tablesMap = {};
            tablesData.forEach(t => {
                tablesMap[t.id] = t.label;
            });
            setTables(tablesMap);
        }

        setReservations(resData || []);
        setLoading(false);
    };

    const handleUpdateStatus = async (id, newStatus) => {
        if (!window.confirm(`Sigur doriți să schimbați statusul în ${newStatus}?`)) return;
        const { error } = await supabase.from('event_reservations').update({ status: newStatus }).eq('id', id);
        if (error) alert('Eroare: ' + error.message);
        else fetchReservations();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sigur doriți să ștergeți această rezervare? Această acțiune este ireversibilă.')) return;
        const { error } = await supabase.from('event_reservations').delete().eq('id', id);
        if (error) alert('Eroare: ' + error.message);
        else fetchReservations();
    };

    const filteredReservations = reservations.filter(r => {
        const matchesSearch = r.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              r.guest_phone.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDietary = (type) => {
        switch(type) {
            case 'post': return 'Post';
            case 'frupt': return 'Frupt';
            case 'both': return 'Post & Frupt';
            default: return '-';
        }
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredReservations.map(r => ({
            Data: new Date(r.created_at).toLocaleString('ro-RO'),
            Nume: r.guest_name,
            Telefon: r.guest_phone,
            Masa: tables[r.table_id] || r.table_id || 'Nespecificată',
            Locuri: r.seat_count,
            Preferințe: formatDietary(r.dietary_preference),
            Observații: r.observations || '-',
            Status: r.status
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rezervari");
        XLSX.writeFile(wb, `Rezervari_${eventId}.xlsx`);
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Rezervari Eveniment`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generat la: ${new Date().toLocaleString('ro-RO')}`, 14, 28);
        doc.text(`Total locuri: ${totalSeats}`, 14, 34);

        const tableColumn = ["Nr", "Data", "Nume", "Telefon", "Masa", "Loc", "Pref", "Status", "Obs"];
        const tableRows = [];

        filteredReservations.forEach((r, index) => {
            const reservationData = [
                index + 1,
                new Date(r.created_at).toLocaleString('ro-RO'),
                r.guest_name,
                r.guest_phone,
                tables[r.table_id] || r.table_id || '-',
                r.seat_count,
                formatDietary(r.dietary_preference),
                r.status === 'confirmed' ? 'OK' : 'ANULAT',
                r.observations || '-'
            ];
            tableRows.push(reservationData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            styles: { fontSize: 8, overflow: 'linebreak' },
            headStyles: { fillColor: [153, 0, 0] },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 25 }, // Data
                2: { cellWidth: 30 }, // Nume
                3: { cellWidth: 25 }, // Telefon
                4: { cellWidth: 20 }, // Masa
                5: { cellWidth: 10 }, // Locuri
                6: { cellWidth: 20 }, // Preferinte
                7: { cellWidth: 15 }, // Status
                8: { cellWidth: 'auto' } // Obs
            }
        });

        doc.save(`Rezervari_Eveniment_${eventId}.pdf`);
    };

    const totalSeats = reservations.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.seat_count, 0);

    if (loading) return <div>Se încarcă rezervările...</div>;

    return (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rezervări Eveniment</h2>
                    <p style={{ color: '#6b7280' }}>Total locuri rezervate: <strong>{totalSeats}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        <Download size={16} /> Export PDF
                    </button>
                    <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        <Download size={16} /> Export Excel
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input 
                        placeholder="Caută după nume sau telefon..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>
                <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                    <option value="all">Toate Statusurile</option>
                    <option value="confirmed">Confirmate</option>
                    <option value="cancelled">Anulate</option>
                </select>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Data</th>
                        <th style={{ padding: '12px' }}>Nume</th>
                        <th style={{ padding: '12px' }}>Telefon</th>
                        <th style={{ padding: '12px' }}>Masa</th>
                        <th style={{ padding: '12px' }}>Locuri</th>
                        <th style={{ padding: '12px' }}>Preferințe</th>
                        <th style={{ padding: '12px' }}>Observații</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px' }}>Acțiuni</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredReservations.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px' }}>{new Date(r.created_at).toLocaleString('ro-RO')}</td>
                            <td style={{ padding: '12px', fontWeight: '500' }}>{r.guest_name}</td>
                            <td style={{ padding: '12px' }}>{r.guest_phone}</td>
                            <td style={{ padding: '12px' }}>{tables[r.table_id] || r.table_id || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{r.seat_count}</td>
                            <td style={{ padding: '12px' }}>
                                {r.dietary_preference === 'post' && <span style={{ background: '#ecfccb', color: '#3f6212', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Post</span>}
                                {r.dietary_preference === 'frupt' && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Frupt</span>}
                                {r.dietary_preference === 'both' && <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Post & Frupt</span>}
                                {!r.dietary_preference || r.dietary_preference === 'none' ? '-' : ''}
                            </td>
                            <td style={{ padding: '12px', maxWidth: '200px', fontSize: '0.9rem', color: '#4b5563' }}>
                                {r.observations || '-'}
                            </td>
                            <td style={{ padding: '12px' }}>
                                <span style={{ 
                                    padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                                    background: r.status === 'confirmed' ? '#d1fae5' : '#fee2e2',
                                    color: r.status === 'confirmed' ? '#065f46' : '#991b1b'
                                }}>
                                    {r.status === 'confirmed' ? 'CONFIRMAT' : 'ANULAT'}
                                </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {r.status === 'confirmed' && (
                                        <button 
                                            onClick={() => handleUpdateStatus(r.id, 'cancelled')}
                                            title="Anulează Rezervarea"
                                            style={{ color: '#f59e0b', background: 'none', border: '1px solid #f59e0b', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <XCircle size={14} /> Anulează
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDelete(r.id)}
                                        title="Șterge Rezervarea"
                                        style={{ color: '#ef4444', background: 'none', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Trash2 size={14} /> Șterge
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredReservations.length === 0 && (
                        <tr>
                            <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Nu există rezervări găsite.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default EventReservations;
