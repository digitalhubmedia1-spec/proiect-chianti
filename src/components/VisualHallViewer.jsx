import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

const VisualHallViewer = ({ hall, objects, reservations, locks, onTableSelect, selectedTableId }) => {
    const canvasRef = useRef(null);
    const [scale, setScale] = useState(1);
    const GRID_SIZE = 20;

    // Check availability for a table
    const getTableStatus = (tableId) => {
        // Check reservation count vs capacity
        const tableReservations = reservations.filter(r => r.table_id === tableId.toString() && r.status === 'confirmed');
        const reservedSeats = tableReservations.reduce((sum, r) => sum + r.seat_count, 0);
        
        const obj = objects.find(o => o.id === tableId);
        if (!obj) return 'unknown';

        if (reservedSeats >= obj.capacity) return 'full';
        if (reservedSeats > 0) return 'partial';
        return 'available';
    };

    const getObjectStyle = (obj) => {
        const isSelected = selectedTableId === obj.id;
        const status = getTableStatus(obj.id);
        
        // Colors based on status
        let bg = '#f8fafc';
        let border = '#94a3b8';
        let color = '#334155';

        if (obj.type.includes('table')) {
            if (status === 'full') { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b'; } // Red
            else if (status === 'partial') { bg = '#fef3c7'; border = '#f59e0b'; color = '#92400e'; } // Orange
            else if (status === 'available') { bg = '#dcfce7'; border = '#22c55e'; color = '#166534'; } // Green
        }

        if (isSelected) {
            border = '#2563eb';
            // box shadow added in return style
        }

        const base = {
            position: 'absolute',
            left: obj.x,
            top: obj.y,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            cursor: (status === 'full') ? 'not-allowed' : 'pointer',
            transform: `rotate(${obj.rotation || 0}deg)`,
            userSelect: 'none',
            transition: 'all 0.2s',
            width: obj.type.includes('round') ? 65 : (obj.type === 'presidium' || obj.type === 'stage' ? 120 : 80),
            height: obj.type.includes('round') ? 65 : (obj.type === 'presidium' ? 40 : (obj.type === 'stage' ? 50 : (obj.type === 'entrance' ? 30 : 80))),
            borderRadius: obj.type.includes('round') ? '50%' : (obj.type === 'stage' ? '8px' : '6px'),
            background: bg,
            border: `2px solid ${border}`,
            color: color,
            boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
            opacity: (status === 'full') ? 0.7 : 1
        };

        // Custom size overrides based on type if needed (copied from Editor)
        if (obj.type === 'presidium') { base.width = 120; base.height = 40; }
        if (obj.type === 'stage') { base.width = 120; base.height = 50; }
        if (obj.type === 'entrance') { base.width = 80; base.height = 30; }
        if (obj.type.includes('table')) { base.width = 80; base.height = 80; base.borderRadius = '6px'; } // Forced square per recent changes

        return base;
    };

    if (!hall) return <div>Încărcare plan...</div>;

    const canvasWidth = Math.max(hall.width_meters * GRID_SIZE, 800);
    const canvasHeight = Math.max(hall.length_meters * GRID_SIZE, 600);

    return (
        <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#ffffff' }}>
            <div
                style={{
                    overflow: 'auto',
                    height: '500px', // Fixed height for scrolling
                    position: 'relative'
                }}
            >
                <div
                    ref={canvasRef}
                    style={{
                        width: canvasWidth * scale,
                        height: canvasHeight * scale,
                        position: 'relative',
                        transformOrigin: '0 0',
                        transform: `scale(${scale})`,
                        margin: '0 auto' // Center if possible
                    }}
                >
                    {/* Dancefloor */}
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

                    {objects.map(obj => {
                        const status = getTableStatus(obj.id);
                        return (
                            <div
                                key={obj.id}
                                onClick={() => {
                                    if (obj.type.includes('table') && status !== 'full') {
                                        onTableSelect(obj);
                                    }
                                }}
                                style={getObjectStyle(obj)}
                            >
                                <span style={{ pointerEvents: 'none', textAlign: 'center', lineHeight: '1.1', padding: '0 4px' }}>
                                    {obj.label}
                                </span>
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
                        );
                    })}
                </div>
            </div>

            {/* Controls */}
            <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: '6px' }}>
                <button onClick={() => setScale(s => Math.min(2, s + 0.1))} style={iconBtnStyle}><ZoomIn size={20} /></button>
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} style={iconBtnStyle}><ZoomOut size={20} /></button>
            </div>
            
            {/* Legend */}
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.9)', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '2px' }}></div> Disponibil</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '2px' }}></div> Parțial Ocupat</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '2px' }}></div> Ocupat</div>
            </div>
        </div>
    );
};

const iconBtnStyle = {
    padding: '8px', border: 'none', background: 'white', borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};

export default VisualHallViewer;
