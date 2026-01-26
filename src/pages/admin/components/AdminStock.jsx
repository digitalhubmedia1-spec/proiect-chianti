import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Package, Search, Filter, AlertTriangle, FileText, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminStock.css';

const AdminStock = () => {
    const [stockItems, setStockItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterLocation, setFilterLocation] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStockLevel, setFilterStockLevel] = useState('>0'); // '>0', 'all', 'low'
    const [searchTerm, setSearchTerm] = useState('');
    const [showExpiredOnly, setShowExpiredOnly] = useState(false);

    // Value Calculation Options
    const [valueMode, setValueMode] = useState('cost'); // 'cost' | 'sale'
    const [vatMode, setVatMode] = useState('no-vat'); // 'no-vat' | 'vat'

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
                inventory_items (name, category, unit, sale_price, vat_rate),
                locations (name)
            `)
            .order('expiration_date', { ascending: true });

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
        // Category Filter
        if (filterCategory && item.inventory_items?.category !== filterCategory) return false;

        // Stock Level Filter
        if (filterStockLevel === '>0' && item.quantity <= 0) return false;
        if (filterStockLevel === 'low' && item.quantity > (item.inventory_items?.min_stock_alert || 5)) return false;

        // Expiry Filter
        if (showExpiredOnly) {
            const days = getDaysUntilExpiry(item.expiration_date);
            if (days > 30) return false; // Show only if < 30 days
        }

        return true;
    });

    // Totals
    // Value Calculation Helper
    const calculateValue = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        let price = 0;

        if (valueMode === 'cost') {
            price = parseFloat(item.purchase_price) || 0;
        } else {
            price = parseFloat(item.inventory_items?.sale_price) || 0;
        }

        if (vatMode === 'vat') {
            const vatRate = parseFloat(item.inventory_items?.vat_rate) || 19;
            price = price * (1 + vatRate / 100);
        }

        return qty * price;
    };

    // Totals
    const totalValue = filteredStock.reduce((acc, item) => acc + calculateValue(item), 0);

    // PDF Sanitizer
    const sanitizeForPDF = (str) => {
        if (!str) return '-';
        return str.toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
            .replace(/ă/g, 'a').replace(/Ă/g, 'A')
            .replace(/â/g, 'a').replace(/Â/g, 'A')
            .replace(/î/g, 'i').replace(/Î/g, 'I')
            .replace(/ș/g, 's').replace(/Ș/g, 'S')
            .replace(/ț/g, 't').replace(/Ț/g, 'T');
    };

    // Export Helpers
    const handleExportCSV = () => {
        const headers = ["Produs", "Categorie", "Gestiune", "Lot", "Expirare", "Stoc", "Pret Unitar", "Valoare Totala"];
        const rows = filteredStock.map(item => [
            item.inventory_items?.name,
            item.inventory_items?.category,
            item.locations?.name,
            item.batch_number,
            item.expiration_date,
            item.quantity,
            valueMode === 'cost' ? item.purchase_price : item.inventory_items?.sale_price,
            calculateValue(item).toFixed(2)
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "stocuri_live.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFont("helvetica"); // Force standard font

        // Header
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("Raport Stocuri Live", 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        const dateStr = new Date().toLocaleString('ro-RO');
        doc.text(`Generat la: ${dateStr}`, 14, 30);

        // Filter Info
        let filterText = `Filtre: ${sanitizeForPDF(filterCategory) || 'Toate categoriile'} | ${filterLocation ? sanitizeForPDF(locations.find(l => l.id == filterLocation)?.name) : 'Toate gestiunile'} | ${filterStockLevel}`;
        doc.setFontSize(10);
        doc.text(filterText, 14, 36);

        // Table
        const headers = [["Produs", "Categorie", "Gestiune", "Lot", "Expira", "Stoc", "Valoare"]];
        const data = filteredStock.map(item => [
            sanitizeForPDF(item.inventory_items?.name),
            sanitizeForPDF(item.inventory_items?.category),
            sanitizeForPDF(item.locations?.name),
            sanitizeForPDF(item.batch_number),
            item.expiration_date || '-',
            `${item.quantity} ${sanitizeForPDF(item.inventory_items?.unit)}`,
            `${calculateValue(item).toFixed(2)} RON`
        ]);

        autoTable(doc, {
            head: headers,
            body: data,
            startY: 40,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                font: 'helvetica' // Ensure autoTable uses helvetica
            },
            headStyles: { fillColor: [153, 0, 0] }, // Chianti Red
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 40 },
        });

        // Totals Grid
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Valoare (${valueMode === 'cost' ? 'Cost' : 'Vanzare'}): ${totalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON`, 14, finalY);

        doc.save("stocuri_live.pdf");
    };

    return (
        <div className="admin-stock-container">
            <h2 className="reception-header-title">
                <Package size={32} className="text-primary" /> Stocuri Live (Pe Loturi)
            </h2>

            <div className="stock-card">
                {/* Filters & Tools Bar */}
                <div className="stock-tools-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>

                    {/* Row 1: Search & Basic Filters */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 2, minWidth: '250px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Caută produs sau lot..."
                                style={{ paddingLeft: '36px', width: '100%' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <select
                                className="form-control"
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                            >
                                <option value="">Toate Categoriile</option>
                                <option value="Materii Prime">Materii Prime</option>
                                <option value="Ambalaje">Ambalaje</option>
                                <option value="Bauturi">Băuturi</option>
                                <option value="Obiecte Inventar">Obiecte Inventar</option>
                            </select>
                        </div>

                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <select
                                className="form-control"
                                value={filterLocation}
                                onChange={e => setFilterLocation(e.target.value)}
                            >
                                <option value="">Toate Gestiunile</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <select
                                className="form-control"
                                value={filterStockLevel}
                                onChange={e => setFilterStockLevel(e.target.value)}
                                style={{ borderColor: filterStockLevel === 'low' ? '#f59e0b' : '#e2e8f0' }}
                            >
                                <option value="all">Orice Stoc</option>
                                <option value=">0">Stoc Pozitiv {'>'} 0</option>
                                <option value="low">Sub Limita Minimă</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Value Settings & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px', gap: '20px', flexWrap: 'wrap' }}>

                        {/* Value Controls */}
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div className="toggle-group" style={{ display: 'flex', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                                <button
                                    onClick={() => setValueMode('cost')}
                                    style={{ padding: '6px 12px', background: valueMode === 'cost' ? '#e2e8f0' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Cost Intrare
                                </button>
                                <div style={{ width: '1px', background: '#cbd5e1' }}></div>
                                <button
                                    onClick={() => setValueMode('sale')}
                                    style={{ padding: '6px 12px', background: valueMode === 'sale' ? '#e2e8f0' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Valoare Vânzare
                                </button>
                            </div>

                            <div className="toggle-group" style={{ display: 'flex', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                                <button
                                    onClick={() => setVatMode('no-vat')}
                                    style={{ padding: '6px 12px', background: vatMode === 'no-vat' ? '#e2e8f0' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Fără TVA
                                </button>
                                <div style={{ width: '1px', background: '#cbd5e1' }}></div>
                                <button
                                    onClick={() => setVatMode('vat')}
                                    style={{ padding: '6px 12px', background: vatMode === 'vat' ? '#e2e8f0' : 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Cu TVA
                                </button>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', marginLeft: '10px' }}>
                                <input
                                    type="checkbox"
                                    checked={showExpiredOnly}
                                    onChange={e => setShowExpiredOnly(e.target.checked)}
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <span style={{ fontSize: '0.9rem', color: showExpiredOnly ? '#dc2626' : '#64748b' }}>
                                    Expirate / Alertă
                                </span>
                            </label>
                        </div>

                        {/* Export & Totals */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={handleExportCSV} className="btn-icon-text" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                                    <FileText size={16} /> CSV
                                </button>
                                <button onClick={handleExportPDF} className="btn-icon-text" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                                    <FileText size={16} /> PDF
                                </button>
                            </div>

                            <div style={{ textAlign: 'right', borderLeft: '2px solid #e2e8f0', paddingLeft: '20px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Valoare Totală ({valueMode === 'cost' ? 'Cost' : 'Vânzare'})</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#16a34a' }}>
                                    {totalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON
                                </div>
                            </div>
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
                                                <div style={{ fontWeight: '600', color: '#0f172a' }}>
                                                    {calculateValue(item).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                                    <span title="Cost de Achiziție">Cost: {item.purchase_price}</span>
                                                    <span title="Preț de Vânzare (fără TVA)">Vnz: {item.inventory_items?.sale_price || '-'}</span>
                                                    {item.purchase_price > 0 && item.inventory_items?.sale_price > 0 && (
                                                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                                                            Adaos: {(((item.inventory_items.sale_price - item.purchase_price) / item.purchase_price) * 100).toFixed(0)}%
                                                        </span>
                                                    )}
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
