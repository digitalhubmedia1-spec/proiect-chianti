import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { BarChart2, AlertOctagon, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import './AdminReception.css';

const AdminReports = () => {
    const [activeReport, setActiveReport] = useState('expiry'); // expiry, valuation, consumption
    const [expiryList, setExpiryList] = useState([]);
    const [valuation, setValuation] = useState({ total: 0, byCategory: [] });
    const [consumption, setConsumption] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReport(activeReport);
    }, [activeReport]);

    const loadReport = async (type) => {
        setLoading(true);
        try {
            if (type === 'expiry') {
                const { data } = await supabase
                    .from('inventory_batches')
                    .select('*, inventory_items(name, unit), locations(name)')
                    .gt('quantity', 0)
                    .order('expiration_date', { ascending: true })
                    .limit(100);
                setExpiryList(data || []);
            }
            else if (type === 'valuation') {
                // Fetch all stock
                const { data } = await supabase
                    .from('inventory_batches')
                    .select('quantity, purchase_price, inventory_items(category, name)');

                if (data) {
                    let total = 0;
                    const catMap = {};

                    data.forEach(item => {
                        const val = item.quantity * (item.purchase_price || 0);
                        total += val;
                        const cat = item.inventory_items?.category || 'Necategorizat';
                        if (!catMap[cat]) catMap[cat] = 0;
                        catMap[cat] += val;
                    });

                    setValuation({
                        total,
                        byCategory: Object.entries(catMap).map(([k, v]) => ({ category: k, value: v }))
                    });
                }
            }
            else if (type === 'consumption') {
                const { data } = await supabase
                    .from('inventory_transactions')
                    .select('*, inventory_items(name, unit), locations:from_location_id(name)')
                    .eq('transaction_type', 'OUT')
                    .order('created_at', { ascending: false })
                    .limit(50);
                setConsumption(data || []);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const getExpiryStatus = (dateStr) => {
        const days = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
        if (days < 0) return { label: 'EXPIRAT', color: '#ef4444', days };
        if (days < 7) return { label: 'CRITIC (<7 zile)', color: '#dc2626', days };
        if (days < 30) return { label: 'ATENȚIE (<30 zile)', color: '#d97706', days };
        return { label: 'OK', color: '#16a34a', days };
    };

    return (
        <div className="admin-reception-container">
            <h2 className="reception-header-title">
                <BarChart2 size={32} className="text-primary" /> Rapoarte & Analize
            </h2>

            <div className="stock-filters-bar" style={{ gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`tab-btn ${activeReport === 'expiry' ? 'active' : ''}`}
                    onClick={() => setActiveReport('expiry')}
                >
                    <AlertOctagon size={18} style={{ marginRight: '8px' }} /> Alerte Expirare
                </button>
                <button
                    className={`tab-btn ${activeReport === 'valuation' ? 'active' : ''}`}
                    onClick={() => setActiveReport('valuation')}
                >
                    <DollarSign size={18} style={{ marginRight: '8px' }} /> Valoare Stoc
                </button>
                <button
                    className={`tab-btn ${activeReport === 'consumption' ? 'active' : ''}`}
                    onClick={() => setActiveReport('consumption')}
                >
                    <TrendingDown size={18} style={{ marginRight: '8px' }} /> Istoric Consum
                </button>
            </div>

            <div className="reception-card">
                {loading && <p>Se generează raportul...</p>}

                {!loading && activeReport === 'expiry' && (
                    <div className="invoice-lines-section">
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Produse cu Risc de Expirare (Top 100)</h3>
                        <div className="lines-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                            <div>Produs</div>
                            <div>Gestiune</div>
                            <div>Lot</div>
                            <div>Expiră</div>
                            <div>Status</div>
                        </div>
                        {expiryList.map(item => {
                            const status = getExpiryStatus(item.expiration_date);
                            return (
                                <div key={item.id} className="line-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                                    <div style={{ fontWeight: '600' }}>{item.inventory_items?.name}</div>
                                    <div>{item.locations?.name}</div>
                                    <div className="badge badge-batch">{item.batch_number}</div>
                                    <div>{item.expiration_date}</div>
                                    <div style={{ fontWeight: 'bold', color: status.color }}>{status.label}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && activeReport === 'valuation' && (
                    <div>
                        <div style={{ textAlign: 'center', padding: '2rem', background: '#f0fdf4', borderRadius: '12px', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '1.2rem', color: '#166534' }}>Valoare Totală Stoc Scriptic</div>
                            <div style={{ fontSize: '3rem', fontWeight: '800', color: '#15803d' }}>
                                {valuation.total.toLocaleString('ro-RO', { style: 'currency', currency: 'RON' })}
                            </div>
                        </div>

                        <h3 style={{ marginBottom: '1rem' }}>Detaliere pe Categorii</h3>
                        <div className="invoice-lines-section">
                            <div className="lines-header" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div>Categorie</div>
                                <div style={{ textAlign: 'right' }}>Valoare</div>
                            </div>
                            {valuation.byCategory.sort((a, b) => b.value - a.value).map((cat, idx) => (
                                <div key={idx} className="line-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div style={{ fontWeight: '600' }}>{cat.category || 'Fără Categorie'}</div>
                                    <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                        {cat.value.toLocaleString('ro-RO', { style: 'currency', currency: 'RON' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && activeReport === 'consumption' && (
                    <div className="invoice-lines-section">
                        <h3 style={{ marginBottom: '1rem' }}>Ultimele 50 Ieșiri din Stoc</h3>
                        <div className="lines-header" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr' }}>
                            <div>Data</div>
                            <div>Produs</div>
                            <div>Locație</div>
                            <div>Cantitate</div>
                            <div>Motiv</div>
                        </div>
                        {consumption.map(txn => (
                            <div key={txn.id} className="line-row" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr' }}>
                                <div>{new Date(txn.created_at).toLocaleDateString('ro-RO')}</div>
                                <div style={{ fontWeight: '600' }}>{txn.inventory_items?.name}</div>
                                <div>{txn.locations?.name}</div>
                                <div style={{ color: '#dc2626', fontWeight: 'bold' }}>-{txn.quantity} {txn.inventory_items?.unit}</div>
                                <div>{txn.reason}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReports;
