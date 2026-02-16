
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabaseClient';
import { Save, Plus, RotateCw, ZoomIn, ZoomOut, Move, Trash2, DoorOpen, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const VisualHallEditor = ({ eventId, hallId, readOnly = false }) => {
    // Canvas & State
    const canvasRef = useRef(null);
    const [hall, setHall] = useState(null);
    const [objects, setObjects] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [loading, setLoading] = useState(true);

    const GRID_SIZE = 20;

    useEffect(() => {
        loadData();
    }, [hallId, eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const { data: hallData } = await supabase
                .from('event_halls')
                .select('*')
                .eq('id', hallId)
                .single();
            setHall(hallData);

            const { data: objData } = await supabase
                .from('event_layout_objects')
                .select('*')
                .eq('event_id', eventId);
            setObjects(objData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- GEOMETRY & ZONES ---
    const calculateZone = (obj) => {
        if (!hall) return 'center';
        const centerX = (hall.width_meters * GRID_SIZE) / 2;
        if (obj.x < centerX - 50) return 'left';
        if (obj.x > centerX + 50) return 'right';
        return 'front';
    };

    // --- GET LABEL FOR OBJECT TYPE ---
    const getLabelForType = (type) => {
        switch (type) {
            case 'presidium': return 'Masa Mirilor';
            case 'stage': return 'Scenă';
            case 'entrance': return 'Intrare';
            default: {
                const tableCount = objects.filter(o => o.type.includes('table')).length;
                return `Masa ${tableCount + 1}`;
            }
        }
    };

    const getCapacityForType = (type) => {
        if (type === 'presidium') return 4;
        if (type === 'stage' || type === 'entrance') return 0;
        if (type.includes('12')) return 12;
        if (type.includes('8')) return 8;
        if (type.includes('6')) return 6;
        if (type.includes('4')) return 4;
        return 0;
    };

    // --- OBJECT VISUAL STYLES ---
    const getObjectStyle = (obj) => {
        const isSelected = selectedId === obj.id;
        const base = {
            position: 'absolute',
            left: obj.x,
            top: obj.y,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            cursor: readOnly ? 'default' : 'move',
            transform: `rotate(${obj.rotation || 0}deg)`,
            userSelect: 'none',
            transition: isDragging ? 'none' : 'box-shadow 0.2s'
        };

        switch (obj.type) {
            case 'presidium':
                return {
                    ...base,
                    width: 120, height: 40,
                    borderRadius: '6px',
                    background: isSelected ? '#fef3c7' : '#fbbf24',
                    border: `2px solid ${isSelected ? '#d97706' : '#f59e0b'}`,
                    color: '#78350f',
                    boxShadow: isSelected ? '0 0 0 3px rgba(217,119,6,0.3)' : 'none'
                };
            case 'stage':
                return {
                    ...base,
                    width: 120, height: 50,
                    borderRadius: '8px',
                    background: isSelected ? '#ede9fe' : '#8b5cf6',
                    border: `2px solid ${isSelected ? '#7c3aed' : '#6d28d9'}`,
                    color: isSelected ? '#5b21b6' : 'white',
                    boxShadow: isSelected ? '0 0 0 3px rgba(124,58,237,0.3)' : 'none'
                };
            case 'entrance':
                return {
                    ...base,
                    width: 80, height: 30,
                    borderRadius: '4px',
                    background: isSelected ? '#dcfce7' : '#22c55e',
                    border: `2px dashed ${isSelected ? '#16a34a' : '#15803d'}`,
                    color: isSelected ? '#166534' : 'white',
                    boxShadow: isSelected ? '0 0 0 3px rgba(22,163,74,0.3)' : 'none'
                };
            default: // Tables (Toate patrate/dreptunghiulare acum)
                return {
                    ...base,
                    width: 80, // Standardizat la 80px
                    height: 80, // Standardizat la 80px pentru patrate
                    borderRadius: '6px', // Fara cercuri (50%)
                    background: isSelected ? '#dbeafe' : '#f8fafc',
                    border: `2px solid ${isSelected ? '#2563eb' : '#94a3b8'}`,
                    color: '#334155',
                    boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                };
        }
    };

    // --- INTERACTION ---
    const handleMouseDown = (e, objId) => {
        if (readOnly) return;
        e.stopPropagation();
        setSelectedId(objId);
        setIsDragging(true);

        const obj = objects.find(o => o.id === objId);
        const recto = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - recto.left) / scale;
        const mouseY = (e.clientY - recto.top) / scale;

        setDragOffset({
            x: mouseX - obj.x,
            y: mouseY - obj.y
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !selectedId) return;

        const recto = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - recto.left) / scale;
        const mouseY = (e.clientY - recto.top) / scale;

        setObjects(prev => prev.map(o => {
            if (o.id === selectedId) {
                const newX = mouseX - dragOffset.x;
                const newY = mouseY - dragOffset.y;
                return {
                    ...o,
                    x: Math.round(newX / 10) * 10,
                    y: Math.round(newY / 10) * 10,
                    zone: calculateZone({ x: newX, y: newY })
                };
            }
            return o;
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const addObject = async (type) => {
        if (readOnly) return;
        const label = getLabelForType(type);
        const capacity = getCapacityForType(type);

        const newObj = {
            event_id: eventId,
            type,
            x: 100, y: 100,
            rotation: 0,
            label,
            capacity
        };

        const tempId = Date.now();
        setObjects([...objects, { ...newObj, id: tempId }]);

        const { data, error } = await supabase.from('event_layout_objects').insert([newObj]).select().single();
        if (data) {
            setObjects(prev => prev.map(o => o.id === tempId ? data : o));
            setSelectedId(data.id);
        }
    };

    const updateObject = async (id, changes) => {
        setObjects(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
        await supabase.from('event_layout_objects').update(changes).eq('id', id);
    };

    const deleteObject = async () => {
        if (!selectedId) return;
        if (!window.confirm("Ștergi acest element?")) return;
        setObjects(prev => prev.filter(o => o.id !== selectedId));
        await supabase.from('event_layout_objects').delete().eq('id', selectedId);
        setSelectedId(null);
    };

    const saveLayout = async () => {
        const updates = objects.map(o => ({
            id: o.id,
            event_id: eventId,
            type: o.type,
            label: o.label,
            x: o.x,
            y: o.y,
            rotation: o.rotation || 0,
            capacity: o.capacity || 0,
            zone: o.zone || 'center'
        }));
        const { error } = await supabase.from('event_layout_objects').upsert(updates, { onConflict: 'id' });
        if (!error) alert("Layout salvat!");
    };

    const exportFloorPlanPDF = async () => {
        if (!canvasRef.current) return;
        try {
            const canvas = await html2canvas(canvasRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });
            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF('landscape', 'mm', 'a4');
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const imgW = pageW - 20;
            const imgH = (canvas.height / canvas.width) * imgW;
            doc.setFont('helvetica');
            doc.setFontSize(14);
            doc.text('Plan Sala - Eveniment', 10, 12);
            doc.setFontSize(9);
            doc.text(`Generat: ${new Date().toLocaleString('ro-RO')}`, 10, 18);
            doc.addImage(imgData, 'PNG', 10, 22, imgW, Math.min(imgH, pageH - 30));
            doc.save('plan_sala.pdf');
        } catch (err) {
            console.error('Floor plan PDF error:', err);
            alert('Eroare la export PDF: ' + err.message);
        }
    };

    // --- RENDERING ---
    if (loading || !hall) return <div>Încărcare plan...</div>;

    const canvasWidth = Math.max(hall.width_meters * GRID_SIZE, 800);
    const canvasHeight = Math.max(hall.length_meters * GRID_SIZE, 600);

    const selectedObj = selectedId ? objects.find(o => o.id === selectedId) : null;

    return (
        <div style={{ display: 'flex', height: '80vh', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: '#f8f9fa' }}>
            {/* Toolbar */}
            {!readOnly && (
                <div style={{ width: '220px', background: 'white', padding: '1.25rem', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>Elemente</h3>

                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mese</p>
                    <button onClick={() => addObject('table_round_12')} style={btnStyle}>▪ Masa patr. 12 P</button>
                    <button onClick={() => addObject('table_round_8')} style={btnStyle}>▪ Masa patr. 8 P</button>
                    <button onClick={() => addObject('table_rect_6')} style={btnStyle}>▬ Masa drept. 6 P</button>
                    <button onClick={() => addObject('table_rect_4')} style={btnStyle}>▪ Masa patr. 4 P</button>

                    <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '0.5rem 0' }} />
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Speciale</p>
                    <button onClick={() => addObject('presidium')} style={{ ...btnStyle, borderColor: '#fbbf24', color: '#92400e' }}>👑 Masa Mirilor</button>
                    <button onClick={() => addObject('stage')} style={{ ...btnStyle, borderColor: '#8b5cf6', color: '#5b21b6' }}>🎵 Scenă / Formație</button>
                    <button onClick={() => addObject('entrance')} style={{ ...btnStyle, borderColor: '#22c55e', color: '#166534' }}>🚪 Intrare</button>

                    {/* Selected Object Info */}
                    {selectedObj && (
                        <div style={{ marginTop: 'auto', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>Selectat: {selectedObj.label}</p>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.7rem', color: '#6b7280' }}>Etichetă</label>
                                <input
                                    type="text"
                                    value={selectedObj.label || ''}
                                    onChange={e => updateObject(selectedId, { label: e.target.value })}
                                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.8rem' }}
                                />
                            </div>
                            {(selectedObj.type.includes('table') || selectedObj.type === 'presidium') && (
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: '#6b7280' }}>Capacitate</label>
                                    <input
                                        type="number"
                                        value={selectedObj.capacity || 0}
                                        onChange={e => updateObject(selectedId, { capacity: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.8rem' }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={saveLayout} style={{ ...btnStyle, background: '#111827', color: 'white', border: 'none', marginTop: selectedObj ? '0.5rem' : 'auto', fontWeight: '600' }}>
                        <Save size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Salvează Tot
                    </button>
                </div>
            )}

            {/* Canvas Area */}
            <div
                style={{ flex: 1, overflow: 'auto', position: 'relative', cursor: isDragging ? 'grabbing' : 'default' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={() => { if (!isDragging) setSelectedId(null); }}
            >
                <div
                    ref={canvasRef}
                    style={{
                        width: canvasWidth * scale,
                        height: canvasHeight * scale,
                        border: '2px solid #374151',
                        background: '#ffffff',
                        backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                        backgroundSize: `${20 * scale}px ${20 * scale}px`,
                        margin: '1rem',
                        position: 'relative',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        borderRadius: '8px',
                        transformOrigin: '0 0',
                        transform: `scale(${scale})`
                    }}
                >
                    {/* Fixed: Dancefloor */}
                    {hall.dancefloor_x && (
                        <div style={{
                            position: 'absolute',
                            left: hall.dancefloor_x * GRID_SIZE,
                            top: hall.dancefloor_y * GRID_SIZE,
                            width: 100, height: 100,
                            borderRadius: '50%', border: '2px dashed #d1d5db',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#9ca3af', fontWeight: 'bold', fontSize: '0.8rem'
                        }}>RING</div>
                    )}

                    {/* Objects */}
                    {objects.map(obj => (
                        <div
                            key={obj.id}
                            onMouseDown={(e) => handleMouseDown(e, obj.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={getObjectStyle(obj)}
                        >
                            <span style={{ pointerEvents: 'none', textAlign: 'center', lineHeight: '1.1', padding: '0 4px' }}>
                                {obj.label}
                            </span>
                            {/* Capacity badge (only for tables) */}
                            {obj.capacity > 0 && (
                                <div style={{
                                    position: 'absolute', top: -14,
                                    background: '#f1f5f9', padding: '1px 6px',
                                    borderRadius: '10px', fontSize: '0.6rem',
                                    color: '#475569', border: '1px solid #e2e8f0',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {obj.capacity} P
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Zoom & Action Controls */}
                <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: '6px' }}>
                    <button onClick={() => setScale(s => Math.min(2, s + 0.1))} style={iconBtnStyle} title="Mărește"><ZoomIn size={20} /></button>
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} style={iconBtnStyle} title="Micșorează"><ZoomOut size={20} /></button>
                    {selectedId && (
                        <>
                            <button onClick={() => {
                                const obj = objects.find(o => o.id === selectedId);
                                updateObject(selectedId, { rotation: (obj.rotation || 0) + 45 });
                            }} style={iconBtnStyle} title="Rotește"><RotateCw size={20} /></button>
                            <button onClick={deleteObject} style={{ ...iconBtnStyle, color: '#ef4444' }} title="Șterge"><Trash2 size={20} /></button>
                        </>
                    )}
                    <button onClick={exportFloorPlanPDF} style={{ ...iconBtnStyle, color: '#990000' }} title="Export PDF Plan"><Download size={20} /></button>
                </div>
            </div>

            {/* Info Panel */}
            <div style={{ width: '220px', background: 'white', borderLeft: '1px solid #e5e7eb', padding: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>Statistici Sală</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f9fafb', borderRadius: '6px' }}>
                        <span style={{ color: '#6b7280' }}>Stânga</span>
                        <strong>{objects.filter(o => o.zone === 'left' && o.type.includes('table')).length} mese</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f9fafb', borderRadius: '6px' }}>
                        <span style={{ color: '#6b7280' }}>Dreapta</span>
                        <strong>{objects.filter(o => o.zone === 'right' && o.type.includes('table')).length} mese</strong>
                    </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '1rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600' }}>
                    <span>Total Locuri</span>
                    <span style={{ color: '#111827' }}>{objects.reduce((sum, o) => sum + (o.capacity || 0), 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginTop: '6px' }}>
                    <span>Total Mese</span>
                    <span>{objects.filter(o => o.type.includes('table') || o.type === 'presidium').length}</span>
                </div>
            </div>
        </div>
    );
};

const btnStyle = {
    padding: '8px 10px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px',
    cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'background 0.15s'
};

const iconBtnStyle = {
    padding: '10px', border: 'none', background: 'white', borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};

export default VisualHallEditor;
