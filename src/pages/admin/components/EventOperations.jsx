
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Clock, Users, CheckCircle, FileText, Plus, Trash2, Save, Upload, Download, Eye, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const roleLabels = {
    manager: 'Manager Eveniment',
    bucatar_sef: 'Bucatar Sef',
    ospatar: 'Ospatar',
    barman: 'Barman',
    hostess: 'Hostess'
};

const sanitize = (str) => {
    if (!str) return '-';
    return str.toString()
        .replace(/ă/g, 'a').replace(/Ă/g, 'A')
        .replace(/â/g, 'a').replace(/Â/g, 'A')
        .replace(/î/g, 'i').replace(/Î/g, 'I')
        .replace(/ș/g, 's').replace(/Ș/g, 'S')
        .replace(/ț/g, 't').replace(/Ț/g, 'T')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ţ/g, 't').replace(/Ţ/g, 'T');
};

const EventOperations = ({ eventId, eventStatus, onUpdateStatus }) => {
    const [activeSection, setActiveSection] = useState('timeline');
    const [timeline, setTimeline] = useState([]);
    const [staff, setStaff] = useState([]);
    const [closingData, setClosingData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [newItem, setNewItem] = useState({ time_start: '', activity: '', notes: '' });
    const [newStaff, setNewStaff] = useState({ staff_name: '', role: 'ospatar' });
    const [pvData, setPvData] = useState({
        total_sales: 0,
        tips_amount: 0,
        broken_items_cost: 0,
        notes: '',
        manager_signed_by: ''
    });
    const [pvFileUrl, setPvFileUrl] = useState(null);
    const [pvUploading, setPvUploading] = useState(false);

    useEffect(() => { loadData(); }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        const { data: t } = await supabase.from('event_timeline_items').select('*').eq('event_id', eventId).order('time_start');
        setTimeline(t || []);
        const { data: s } = await supabase.from('event_staff_assignments').select('*').eq('event_id', eventId);
        setStaff(s || []);
        const { data: c } = await supabase.from('event_closing_reports').select('*').eq('event_id', eventId).single();
        if (c) { setClosingData(c); setPvData(c); if (c.pv_document_url) setPvFileUrl(c.pv_document_url); }
        setLoading(false);
    };

    // --- TIMELINE ACTIONS ---
    const handleAddItem = async () => {
        if (!newItem.time_start || !newItem.activity) return;
        const { data } = await supabase.from('event_timeline_items').insert([{ ...newItem, event_id: eventId }]).select().single();
        if (data) {
            setTimeline([...timeline, data].sort((a, b) => a.time_start.localeCompare(b.time_start)));
            setNewItem({ time_start: '', activity: '', notes: '' });
        }
    };

    const handleDeleteItem = async (id) => {
        await supabase.from('event_timeline_items').delete().eq('id', id);
        setTimeline(timeline.filter(i => i.id !== id));
    };

    const toggleItemStatus = async (item) => {
        const newStatus = item.status === 'done' ? 'pending' : 'done';
        await supabase.from('event_timeline_items').update({ status: newStatus }).eq('id', item.id);
        setTimeline(timeline.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    };

    // --- STAFF ACTIONS ---
    const handleAddStaff = async () => {
        if (!newStaff.staff_name) return;
        const { data } = await supabase.from('event_staff_assignments').insert([{ ...newStaff, event_id: eventId }]).select().single();
        if (data) {
            setStaff([...staff, data]);
            setNewStaff({ staff_name: '', role: 'ospatar' });
        }
    };

    const handleDeleteStaff = async (id) => {
        await supabase.from('event_staff_assignments').delete().eq('id', id);
        setStaff(staff.filter(s => s.id !== id));
    };

    const exportStaffPDF = () => {
        const doc = new jsPDF();
        doc.setFont('helvetica');
        doc.setFontSize(16);
        doc.text(sanitize('Echipa & Staff - Eveniment'), 14, 18);
        doc.setFontSize(10);
        doc.text(`Total: ${staff.length} persoane`, 14, 26);
        doc.text(`Generat: ${new Date().toLocaleString('ro-RO')}`, 14, 32);

        const headers = [['#', 'Nume', 'Rol']];
        const data = staff.map((s, i) => [
            i + 1,
            sanitize(s.staff_name),
            sanitize(roleLabels[s.role] || s.role)
        ]);

        autoTable(doc, {
            head: headers,
            body: data,
            startY: 38,
            styles: { fontSize: 10, cellPadding: 4, font: 'helvetica' },
            headStyles: { fillColor: [153, 0, 0] },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        doc.save(`staff_eveniment_${eventId}.pdf`);
    };

    const exportTimelinePDF = () => {
        const doc = new jsPDF();
        doc.setFont('helvetica');
        doc.setFontSize(16);
        doc.text(sanitize('Desfasurator Eveniment'), 14, 18);
        doc.setFontSize(10);
        doc.text(`Total: ${timeline.length} activitati`, 14, 26);
        doc.text(`Generat: ${new Date().toLocaleString('ro-RO')}`, 14, 32);

        const headers = [['Ora', 'Activitate']];
        const data = timeline.map(item => [
            item.time_start ? item.time_start.slice(0, 5) : '-',
            sanitize(item.activity || '-')
        ]);

        autoTable(doc, {
            head: headers,
            body: data,
            startY: 38,
            styles: { fontSize: 10, cellPadding: 4, font: 'helvetica' },
            headStyles: { fillColor: [153, 0, 0] },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        doc.save(`desfasurator_eveniment_${eventId}.pdf`);
    };

    // --- CLOSING ACTIONS ---
    const handleUploadPV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPvUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `proces_verbal/${eventId}/pv_${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage.from('event-documents').upload(path, file, { upsert: true });
            if (uploadErr) throw uploadErr;
            const { data: urlData } = supabase.storage.from('event-documents').getPublicUrl(path);
            const publicUrl = urlData.publicUrl;
            setPvFileUrl(publicUrl);
            // Save reference in closing reports
            await supabase.from('event_closing_reports').upsert({
                event_id: eventId,
                pv_document_url: publicUrl
            }).select().single();
        } catch (err) {
            console.error('Upload error:', err);
            alert('Eroare la încărcare: ' + err.message);
        }
        setPvUploading(false);
    };

    const handleDeletePV = async () => {
        if (!window.confirm('Sigur doriți să ștergeți documentul încărcat?')) return;
        setPvFileUrl(null);
        await supabase.from('event_closing_reports').upsert({
            event_id: eventId,
            pv_document_url: null
        });
    };

    const handleFinalize = async () => {
        if (!pvFileUrl) {
            alert('Trebuie să încărcați procesul verbal scanat înainte de a finaliza.');
            return;
        }
        if (!window.confirm('Sigur doriți să marcați evenimentul ca FINALIZAT?')) return;
        await supabase.from('events').update({ status: 'completed' }).eq('id', eventId);
        if (onUpdateStatus) onUpdateStatus('completed');
        alert('Evenimentul a fost marcat ca finalizat!');
    };

    if (loading) return <div>Incarcare date operationale...</div>;

    return (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', minHeight: '500px' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <button onClick={() => setActiveSection('timeline')} style={{ background: 'none', border: 'none', borderBottom: activeSection === 'timeline' ? '2px solid #990000' : 'none', fontWeight: activeSection === 'timeline' ? 'bold' : 'normal', cursor: 'pointer', padding: '5px 10px' }}>
                    <Clock size={16} style={{ marginBottom: '-3px', marginRight: '5px' }} /> Desfășurător
                </button>
                <button onClick={() => setActiveSection('staff')} style={{ background: 'none', border: 'none', borderBottom: activeSection === 'staff' ? '2px solid #990000' : 'none', fontWeight: activeSection === 'staff' ? 'bold' : 'normal', cursor: 'pointer', padding: '5px 10px' }}>
                    <Users size={16} style={{ marginBottom: '-3px', marginRight: '5px' }} /> Echipă & Staff
                </button>
                <button onClick={() => setActiveSection('closing')} style={{ background: 'none', border: 'none', borderBottom: activeSection === 'closing' ? '2px solid #990000' : 'none', fontWeight: activeSection === 'closing' ? 'bold' : 'normal', cursor: 'pointer', padding: '5px 10px' }}>
                    <FileText size={16} style={{ marginBottom: '-3px', marginRight: '5px' }} /> Proces Verbal Închidere
                </button>
            </div>

            {/* TIMELINE */}
            {activeSection === 'timeline' && (
                <div>
                    <div style={{ marginBottom: '2rem', display: 'flex', gap: '10px', alignItems: 'end', background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Ora</label>
                            <input type="time" value={newItem.time_start} onChange={e => setNewItem({ ...newItem, time_start: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', display: 'block' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem' }}>Activitate</label>
                            <input placeholder="ex: Sosire Invitați" value={newItem.activity} onChange={e => setNewItem({ ...newItem, activity: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', display: 'block' }} />
                        </div>
                        <button onClick={handleAddItem} style={{ padding: '9px 15px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Plus size={18} /></button>
                    </div>

                    {timeline.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total: <strong>{timeline.length}</strong> activități</span>
                            <button onClick={exportTimelinePDF} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#990000', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                                <Download size={16} /> Export PDF
                            </button>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {timeline.map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', background: item.status === 'done' ? '#f0fdf4' : 'white', opacity: item.status === 'done' ? 0.7 : 1 }}>
                                <button onClick={() => toggleItemStatus(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.status === 'done' ? '#16a34a' : '#d1d5db' }}>
                                    <CheckCircle size={24} fill={item.status === 'done' ? '#16a34a' : 'white'} />
                                </button>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '80px' }}>{item.time_start.slice(0, 5)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', textDecoration: item.status === 'done' ? 'line-through' : 'none' }}>{item.activity}</div>
                                    {item.notes && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{item.notes}</div>}
                                </div>
                                <button onClick={() => handleDeleteItem(item.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                            </div>
                        ))}
                        {timeline.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Nu există activități în desfășurător.</div>}
                    </div>
                </div>
            )}

            {/* STAFF */}
            {activeSection === 'staff' && (
                <div>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '10px', alignItems: 'end', background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem' }}>Nume Membru Staff</label>
                            <input placeholder="ex: Popescu Ion" value={newStaff.staff_name} onChange={e => setNewStaff({ ...newStaff, staff_name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', display: 'block' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Rol</label>
                            <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', display: 'block' }}>
                                <option value="manager">Manager Eveniment</option>
                                <option value="bucatar_sef">Bucătar Șef</option>
                                <option value="ospatar">Ospătar</option>
                                <option value="barman">Barman</option>
                                <option value="hostess">Hostess</option>
                            </select>
                        </div>
                        <button onClick={handleAddStaff} style={{ padding: '9px 15px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Plus size={18} /></button>
                    </div>

                    {staff.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total: <strong>{staff.length}</strong> persoane</span>
                            <button onClick={exportStaffPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#990000', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                                <Download size={16} /> Export PDF
                            </button>
                        </div>
                    )}

                    {staff.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 14px', fontWeight: '600', color: '#374151', width: '40px' }}>#</th>
                                    <th style={{ padding: '10px 14px', fontWeight: '600', color: '#374151' }}>Nume</th>
                                    <th style={{ padding: '10px 14px', fontWeight: '600', color: '#374151' }}>Rol</th>
                                    <th style={{ padding: '10px 14px', fontWeight: '600', color: '#374151', width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map((s, idx) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '10px 14px', color: '#9ca3af' }}>{idx + 1}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: '500' }}>{s.staff_name}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', background: '#f3f4f6', color: '#374151' }}>
                                                {roleLabels[s.role] || s.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <button onClick={() => handleDeleteStaff(s.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Nu există personal adăugat.</div>
                    )}
                </div>
            )}

            {/* CLOSING PV */}
            {activeSection === 'closing' && (
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h3>Proces Verbal de Închidere</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Încărcați documentul scanat al procesului verbal pentru a putea finaliza evenimentul.</p>
                    </div>

                    {/* Upload Area */}
                    {!pvFileUrl ? (
                        <label style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '3rem 2rem', border: '2px dashed #d1d5db', borderRadius: '12px',
                            background: '#f9fafb', cursor: pvUploading ? 'wait' : 'pointer',
                            transition: 'all 0.2s', marginBottom: '1.5rem'
                        }}>
                            <Upload size={40} color="#9ca3af" style={{ marginBottom: '12px' }} />
                            <span style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                {pvUploading ? 'Se încarcă...' : 'Click pentru a încărca documentul'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>PDF, JPG, PNG (max 10MB)</span>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={handleUploadPV}
                                disabled={pvUploading}
                                style={{ display: 'none' }}
                            />
                        </label>
                    ) : (
                        <div style={{
                            padding: '1.5rem', border: '1px solid #d1fae5', borderRadius: '12px',
                            background: '#f0fdf4', marginBottom: '1.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <CheckCircle size={22} color="#16a34a" />
                                    <span style={{ fontWeight: '600', color: '#166534' }}>Document încărcat cu succes</span>
                                </div>
                                <button onClick={handleDeletePV} title="Șterge document" style={{
                                    background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px'
                                }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <a href={pvFileUrl} target="_blank" rel="noopener noreferrer" style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db',
                                    background: 'white', color: '#374151', textDecoration: 'none',
                                    fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer'
                                }}>
                                    <Eye size={16} /> Vizualizare
                                </a>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db',
                                    background: 'white', color: '#374151',
                                    fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer'
                                }}>
                                    <Upload size={16} /> Reîncarcă
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        onChange={handleUploadPV}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                            {pvFileUrl.match(/\.(jpg|jpeg|png|webp)$/i) && (
                                <img src={pvFileUrl} alt="Proces Verbal" style={{
                                    marginTop: '12px', maxWidth: '100%', borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                }} />
                            )}
                        </div>
                    )}

                    {/* Finalize Button */}
                    {eventStatus !== 'completed' && (
                        <button
                            onClick={handleFinalize}
                            disabled={!pvFileUrl}
                            style={{
                                width: '100%', marginTop: '0.5rem',
                                background: pvFileUrl ? '#111827' : '#d1d5db',
                                color: 'white', border: 'none', padding: '15px',
                                borderRadius: '8px', cursor: pvFileUrl ? 'pointer' : 'not-allowed',
                                fontSize: '1rem', fontWeight: 'bold',
                                display: 'flex', justifyContent: 'center', gap: '10px'
                            }}
                        >
                            <CheckCircle size={20} /> Finalizează Eveniment
                        </button>
                    )}

                    {eventStatus === 'completed' && (
                        <div style={{
                            textAlign: 'center', padding: '1rem', background: '#f0fdf4',
                            borderRadius: '8px', border: '1px solid #bbf7d0'
                        }}>
                            <CheckCircle size={24} color="#16a34a" style={{ marginBottom: '6px' }} />
                            <p style={{ fontWeight: '600', color: '#166534', margin: 0 }}>Eveniment Finalizat</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventOperations;
