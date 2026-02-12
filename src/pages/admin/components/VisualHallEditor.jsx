
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabaseClient';
import { Save, Plus, RotateCw, ZoomIn, ZoomOut, Move, Trash2 } from 'lucide-react';

const VisualHallEditor = ({ eventId, hallId, readOnly = false }) => {
    // Canvas & State
    const canvasRef = useRef(null);
    const [hall, setHall] = useState(null);
    const [objects, setObjects] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1); // Zoom
    const [loading, setLoading] = useState(true);

    // Grid Settings
    const GRID_SIZE = 20; // Pixels per meter approx

    useEffect(() => {
        loadData();
    }, [hallId, eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load Hall
            const { data: hallData } = await supabase
                .from('event_halls')
                .select('*')
                .eq('id', hallId)
                .single();
            setHall(hallData);

            // Load Existing Objects
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
        // Simple logic:
        // Axle: Entry (x1,y1) -> Dancefloor (x2, y2).
        // Determine if point (obj.x, obj.y) is Left or Right of this vector.
        // For now, let's assume vertical orientation (Entry at bottom, Dancefloor at center).

        // Center x of hall
        const centerX = (hall.width_meters * GRID_SIZE) / 2;

        if (obj.x < centerX - 50) return 'left';
        if (obj.x > centerX + 50) return 'right';
        return 'front'; // Center-ish
    };

    // --- INTERACTION ---
    const handleMouseDown = (e, objId) => {
        if (readOnly) return;
        e.stopPropagation();
        setSelectedId(objId);
        setIsDragging(true);

        const obj = objects.find(o => o.id === objId);
        // Calculate offset from top-left of object
        // Mouse coordinates relative to canvas
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
                    x: Math.round(newX / 10) * 10, // Snap to 10px
                    y: Math.round(newY / 10) * 10,
                    zone: calculateZone({ x: newX, y: newY }) // Auto-update zone
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
        const newObj = {
            event_id: eventId,
            type,
            x: 100, y: 100,
            rotation: 0,
            label: `Masa ${objects.filter(o => o.type.includes('table')).length + 1}`,
            capacity: type.includes('12') ? 12 : type.includes('8') ? 8 : 4
        };

        // Optimistic UI
        const tempId = Date.now();
        setObjects([...objects, { ...newObj, id: tempId }]);

        // Save to DB
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
        const confirm = window.confirm("Stergi acest element?");
        if (confirm) {
            setObjects(prev => prev.filter(o => o.id !== selectedId));
            await supabase.from('event_layout_objects').delete().eq('id', selectedId);
            setSelectedId(null);
        }
    };

    const saveLayout = async () => {
        // Bulk update positions
        const updates = objects.map(o => ({
            id: o.id,
            x: o.x,
            y: o.y,
            rotation: o.rotation,
            zone: o.zone
        }));

        const { error } = await supabase.from('event_layout_objects').upsert(updates);
        if (!error) alert("Layout salvat!");
    };

    // --- RENDERING ---
    if (loading || !hall) return <div>Incarcare plan...</div>;

    const canvasWidth = hall.width_meters * GRID_SIZE;
    const canvasHeight = hall.length_meters * GRID_SIZE;

    return (
        <div style={{ display: 'flex', height: '80vh', border: '1px solid #ddd', background: '#f8f9fa' }}>
            {/* Toolbar */}
            {!readOnly && (
                <div style={{ width: '200px', background: 'white', padding: '1rem', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3>Elemente</h3>
                    <button onClick={() => addObject('table_round_12')} style={btnStyle}>Masa Rotunda 12</button>
                    <button onClick={() => addObject('table_round_8')} style={btnStyle}>Masa Rotunda 8</button>
                    <button onClick={() => addObject('table_rect_6')} style={btnStyle}>Masa Drept. 6</button>
                    <button onClick={() => addObject('table_rect_4')} style={btnStyle}>Masa Patrata 4</button>
                    <hr />
                    <button onClick={() => addObject('presidium')} style={btnStyle}>Masa Mirilor</button>
                    <button onClick={() => addObject('stage')} style={btnStyle}>Scena / Formatie</button>

                    <div style={{ marginTop: 'auto' }}>
                        <p style={{ fontSize: '0.8rem', color: '#666' }}>Selectat: {selectedId ? objects.find(o => o.id === selectedId)?.label : 'Nimic'}</p>
                        <button onClick={saveLayout} style={{ ...btnStyle, background: '#10b981', color: 'white' }}><Save size={16} /> Salveaza Tot</button>
                    </div>
                </div>
            )}

            {/* Canvas Area */}
            <div
                style={{ flex: 1, overflow: 'auto', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <div
                    ref={canvasRef}
                    style={{
                        width: canvasWidth * scale,
                        height: canvasHeight * scale,
                        border: '2px solid #333',
                        background: 'white',
                        margin: '2rem',
                        position: 'relative',
                        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                        transformOrigin: '0 0',
                        transform: `scale(${scale})`
                    }}
                >
                    {/* Fixed Features */}
                    {hall.dancefloor_x && (
                        <div style={{
                            position: 'absolute',
                            left: hall.dancefloor_x * GRID_SIZE,
                            top: hall.dancefloor_y * GRID_SIZE,
                            width: 100, height: 100,
                            borderRadius: '50%', border: '2px dashed #ccc',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#ccc', fontWeight: 'bold'
                        }}>RING</div>
                    )}

                    {/* Objects */}
                    {objects.map(obj => (
                        <div
                            key={obj.id}
                            onMouseDown={(e) => handleMouseDown(e, obj.id)}
                            style={{
                                position: 'absolute',
                                left: obj.x,
                                top: obj.y,
                                width: obj.type.includes('round') ? 60 : 80,
                                height: obj.type.includes('round') ? 60 : 40,
                                borderRadius: obj.type.includes('round') ? '50%' : '4px',
                                background: selectedId === obj.id ? '#dbeafe' : 'white',
                                border: `2px solid ${selectedId === obj.id ? '#2563eb' : '#64748b'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: 'bold',
                                cursor: 'move',
                                transform: `rotate(${obj.rotation}deg)`,
                                userSelect: 'none'
                            }}
                        >
                            {obj.label}
                            {/* Capacity Dots */}
                            <div style={{ position: 'absolute', top: -15, background: '#eee', padding: '1px 4px', borderRadius: '4px', fontSize: '0.6rem' }}>
                                {obj.capacity} loc
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: '5px' }}>
                    <button onClick={() => setScale(s => s + 0.1)} style={iconBtnStyle}><ZoomIn size={20} /></button>
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} style={iconBtnStyle}><ZoomOut size={20} /></button>
                    {selectedId && (
                        <>
                            <button onClick={() => {
                                const obj = objects.find(o => o.id === selectedId);
                                updateObject(selectedId, { rotation: (obj.rotation || 0) + 45 });
                            }} style={iconBtnStyle}><RotateCw size={20} /></button>
                            <button onClick={deleteObject} style={{ ...iconBtnStyle, color: 'red' }}><Trash2 size={20} /></button>
                        </>
                    )}
                </div>
            </div>

            {/* Info Panel */}
            <div style={{ width: '250px', background: 'white', borderLeft: '1px solid #ddd', padding: '1rem' }}>
                <h4>Statistici Sala</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                    <div><strong>Stanga:</strong> {objects.filter(o => o.zone === 'left').length} mese</div>
                    <div><strong>Dreapta:</strong> {objects.filter(o => o.zone === 'right').length} mese</div>
                    <div><strong>Fata:</strong> {objects.filter(o => o.zone === 'front').length} mese</div>
                </div>
                <hr style={{ margin: '1rem 0' }} />
                <div>Total Locuri: {objects.reduce((sum, o) => sum + (o.capacity || 0), 0)}</div>
            </div>
        </div>
    );
};

const btnStyle = {
    padding: '8px', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer', textAlign: 'left'
};

const iconBtnStyle = {
    padding: '8px', border: 'none', background: 'white', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
};

export default VisualHallEditor;
