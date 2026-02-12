
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const EventProduction = ({ eventId }) => {
    const [stats, setStats] = useState({ total: 0, adult: 0, child: 0, standard: 0, veg: 0, vegan: 0, other: 0 });
    const [menus, setMenus] = useState([]);
    const [mappings, setMappings] = useState({ standard: '', vegetarian: '', vegan: '' });
    const [needs, setNeeds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        // 1. Get Guest Stats
        const { data: guests } = await supabase.from('event_guests').select('type, dietary_pref').eq('event_id', eventId);

        const s = { total: 0, adult: 0, child: 0, standard: 0, veg: 0, vegan: 0, other: 0 };
        if (guests) {
            s.total = guests.length;
            guests.forEach(g => {
                if (g.type === 'adult') s.adult++; else s.child++;
                if (g.dietary_pref === 'standard') s.standard++;
                else if (g.dietary_pref === 'vegetarian') s.veg++;
                else if (g.dietary_pref === 'vegan') s.vegan++;
                else s.other++;
            });
        }
        setStats(s);

        // 2. Get Menus
        const { data: menuData } = await supabase
            .from('event_menu_packages')
            .select('*, event_menu_items(*, products(name, weight, id))')
            .eq('event_id', eventId);
        setMenus(menuData || []);

        // Auto-map if possible (simple heuristic)
        const map = { standard: '', vegetarian: '', vegan: '' };
        if (menuData) {
            menuData.forEach(m => {
                if (m.name.toLowerCase().includes('stand')) map.standard = m.id;
                if (m.name.toLowerCase().includes('veg')) map.vegetarian = m.id;
                if (m.name.toLowerCase().includes('post') || m.name.toLowerCase().includes('vegan')) map.vegan = m.id;
            });
        }
        setMappings(prev => ({ ...prev, ...map }));

        setLoading(false);
    };

    const calculateNeeds = () => {
        // Aggregate all ingredients
        // Formula: 
        // Standard Needs = Stats.Standard * Menu(Mappings.Standard).Items
        // Veg Needs = Stats.Veg * Menu(Mappings.Vegetarian).Items
        // ... etc

        let aggregated = {}; // { productName: { qty, unit, weight } }

        const processMenu = (menuId, count) => {
            if (!menuId || count === 0) return;
            const menu = menus.find(m => m.id === parseInt(menuId));
            if (!menu) return;

            menu.event_menu_items.forEach(item => {
                const pName = item.products?.name || 'Unknown';
                const pWeight = item.products?.weight || 0; // grams usually

                if (!aggregated[pName]) aggregated[pName] = { count: 0, totalWeightKg: 0 };

                aggregated[pName].count += (count * (item.quantity_per_guest || 1));
                aggregated[pName].totalWeightKg += (count * (item.quantity_per_guest || 1) * pWeight) / 1000;
            });
        };

        processMenu(mappings.standard, stats.standard + stats.other); // Assume 'other' gets standard for now unless mapped
        processMenu(mappings.vegetarian, stats.veg);
        processMenu(mappings.vegan, stats.vegan);

        return Object.entries(aggregated).map(([name, data]) => ({ name, ...data }));
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Raport Productie Eveniment", 10, 10);

        const data = calculateNeeds().map(row => [
            row.name,
            row.count.toFixed(1),
            row.totalWeightKg.toFixed(2) + ' kg'
        ]);

        doc.autoTable({
            head: [['Produs / Ingredient', 'Portii', 'Cantitate Totala']],
            body: data,
            startY: 20
        });

        doc.save(`productie_eveniment_${eventId}.pdf`);
    };

    if (loading) return <div>Calculare...</div>;

    const needsList = calculateNeeds();

    return (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Stats Panel */}
                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                    <h4>Statistici Invitați</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                        <div>Total: <strong>{stats.total}</strong></div>
                        <div>Adulți: <strong>{stats.adult}</strong></div>
                        <div>Copii: <strong>{stats.child}</strong></div>
                        <hr style={{ gridColumn: 'span 2' }} />
                        <div>Standard: <strong style={{ color: '#2563eb' }}>{stats.standard}</strong></div>
                        <div>Vegetarian: <strong style={{ color: '#16a34a' }}>{stats.veg}</strong></div>
                        <div>Vegan/Post: <strong style={{ color: '#d97706' }}>{stats.vegan}</strong></div>
                        <div>Altele: <strong>{stats.other}</strong></div>
                    </div>
                </div>

                {/* Mapping Panel */}
                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                    <h4>Asociere Meniuri</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Meniu Standard</label>
                            <select
                                value={mappings.standard}
                                onChange={e => setMappings({ ...mappings, standard: e.target.value })}
                                style={{ width: '100%', padding: '5px' }}
                            >
                                <option value="">- Selectează -</option>
                                {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Meniu Vegetarian</label>
                            <select
                                value={mappings.vegetarian}
                                onChange={e => setMappings({ ...mappings, vegetarian: e.target.value })}
                                style={{ width: '100%', padding: '5px' }}
                            >
                                <option value="">- Selectează -</option>
                                {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem' }}>Meniu Vegan/Post</label>
                            <select
                                value={mappings.vegan}
                                onChange={e => setMappings({ ...mappings, vegan: e.target.value })}
                                style={{ width: '100%', padding: '5px' }}
                            >
                                <option value="">- Selectează -</option>
                                {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Needs Table */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Necesar Aprovizionare / Producție</h3>
                <button
                    onClick={exportPDF}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', background: '#990000', color: 'white',
                        border: 'none', borderRadius: '6px', cursor: 'pointer'
                    }}
                >
                    <Download size={18} /> Export PDF
                </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Produs</th>
                        <th style={{ padding: '10px' }}>Nr. Porții</th>
                        <th style={{ padding: '10px' }}>Total (estimat)</th>
                    </tr>
                </thead>
                <tbody>
                    {needsList.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.name}</td>
                            <td style={{ padding: '10px' }}>{item.count.toFixed(1)}</td>
                            <td style={{ padding: '10px' }}>{item.totalWeightKg.toFixed(2)} kg</td>
                        </tr>
                    ))}
                    {needsList.length === 0 && (
                        <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>Nu există date. Verificați asocierile de meniuri.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default EventProduction;
