import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Package, Search, Filter, AlertTriangle } from 'lucide-react';
import './AdminStock.css';

const AdminStock = () => {
    const [stockItems, setStockItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterLocation, setFilterLocation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showExpiredOnly, setShowExpiredOnly] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // 1. Fetch Locations for Filter
        const { data: locData } = await supabase.from('locations').select('*');
        setLocations(locData || []);

        // 2. Fetch Batches with Relations
        // Note: We need a join. Supabase JS syntax:
        let query = supabase
            .from('inventory_batches')
            .select(`
                *,
                inventory_items (name, category, unit),
                locations (name)
            `)
            .gt('quantity', 0); // Only show positive stock

        const { data, error } = await query;

        if (error) {
            console.error(error);
        } else {
            setStockItems(data);
        }
        setLoading(false);
    };

    // Helper: Days until expiration
    const getDaysUntilExpiry = (dateStr) => {
        if (!dateStr) return 999;
        const today = new Date();
        const exp = new Date(dateStr);
        const diffTime = exp - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Filter Logic
    const filteredStock = stockItems.filter(item => {
        // Location Filter
        if (filterLocation && item.location_id !== parseInt(filterLocation)) return false;

        // Search Filter (Product Name or Batch)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const name = item.inventory_items?.name.toLowerCase() || '';
            const batch = item.batch_number?.toLowerCase() || '';
            if (!name.includes(term) && !batch.includes(term)) return false;
        }

        // Expiry Filter
        if (showExpiredOnly) {
            const days = getDaysUntilExpiry(item.expiration_date);
            if (days > 30) return false; // Show only if < 30 days
        }

        return true;
    });

    // Totals
    const totalValue = filteredStock.reduce((acc, item) => acc + (item.quantity * (item.purchase_price || 0)), 0);

    return (
        <div className="admin-stock-container">
            <h2 className="reception-header-title">
                <Package size={32} className="text-primary" /> Stocuri Live (Pe Loturi)
            </h2>

            <div className="stock-card">
                {/* Filters */}
                <div className="stock-filters-bar">
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Caută produs sau lot..."
                                style={{ paddingLeft: '36px' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ minWidth: '200px' }}>
                        <select
                            className="form-control"
                            value={filterLocation}
                            onChange={e => setFilterLocation(e.target.value)}
                        >
                            <option value="">Toate Gestiunile</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={showExpiredOnly}
                                onChange={e => setShowExpiredOnly(e.target.checked)}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <span style={{ fontWeight: '600', color: showExpiredOnly ? '#dc2626' : '#64748b' }}>
                                Doar expirate / la limită
                            </span>
                        </label>
                    </div>

                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Valoare Totală Stoc Afișat</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#16a34a' }}>
                            {totalValue.toFixed(2)} RON
                        </div>
                    </div>
                </div>

                {/* Table */}
                {loading ? <p>Se încarcă...</p> : (
                    <div className="stock-table-wrapper">
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>Produs</th>
                                    <th>Gestiune</th>
                                    <th>Lot (Batch)</th>
                                    <th>Expiră La</th>
                                    <th>Stoc</th>
                                    <th>Valoare</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStock.map(item => {
                                    const days = getDaysUntilExpiry(item.expiration_date);
                                    let expiryClass = 'expiry-ok';
                                    let expiryTex = item.expiration_date;

                                    if (days < 0) { expiryClass = 'expiry-critical'; expiryTex += ' (EXPIRAT)'; }
                                    else if (days < 7) { expiryClass = 'expiry-critical'; expiryTex += ` (${days} zile)`; }
                                    else if (days < 30) { expiryClass = 'expiry-warning'; expiryTex += ` (${days} zile)`; }

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{item.inventory_items?.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.inventory_items?.category}</div>
                                            </td>
                                            <td>
                                                <span className="badge badge-location">{item.locations?.name}</span>
                                            </td>
                                            <td>
                                                {item.batch_number ? <span className="badge badge-batch">{item.batch_number}</span> : '-'}
                                            </td>
                                            <td>
                                                <span className={expiryClass}>{expiryTex}</span>
                                            </td>
                                            <td>
                                                <div className="stock-quantity text-primary">
                                                    {item.quantity} {item.inventory_items?.unit}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>
                                                    {(item.quantity * (item.purchase_price || 0)).toFixed(2)} RON
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                    {item.purchase_price} RON / unit
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredStock.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                            Nu există stocuri conform filtrelor.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminStock;
