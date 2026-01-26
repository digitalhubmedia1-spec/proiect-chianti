import React, { useState, useEffect } from 'react';
import { X, FileText, ShoppingCart, Check, Download, AlertTriangle } from 'lucide-react';
import { useConsumption } from '../../../hooks/useConsumption';
import { supabase } from '../../../supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { logAction } from '../../../utils/adminLogger';

const ConsumptionReportModal = ({ isOpen, onClose, dateRange, categoryFilter }) => {
    const { calculateNeeds, loading, error } = useConsumption();
    const [needs, setNeeds] = useState([]);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        if (isOpen && dateRange.start) {
            runCalculation();
        }
    }, [isOpen, dateRange, categoryFilter]);

    const runCalculation = async () => {
        const results = await calculateNeeds({
            startDate: dateRange.start,
            endDate: dateRange.end,
            categoryFilter: categoryFilter
        });
        setNeeds(results || []);
    };

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

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFont("helvetica");
        doc.setFontSize(18);
        doc.text("Raport Necesar Consum", 14, 20);

        doc.setFontSize(10);
        doc.text(`Perioada: ${dateRange.start} - ${dateRange.end}`, 14, 30);
        doc.text(`Categorie: ${categoryFilter}`, 14, 35);
        doc.text(`Generat la: ${new Date().toLocaleString('ro-RO')}`, 14, 40);

        const tableData = needs.map(item => [
            sanitizeForPDF(item.name),
            `${item.required.toFixed(2)} ${item.unit}`,
            `${item.stock.toFixed(2)} ${item.unit}`,
            item.to_buy > 0 ? `${item.to_buy.toFixed(2)} ${item.unit}` : 'OK',
            item.to_buy > 0 ? `${item.estimated_cost.toFixed(2)} RON` : '-'
        ]);

        doc.autoTable({
            startY: 45,
            head: [['Produs', 'Necesar', 'Stoc', 'De Cumparat', 'Est. Cost']],
            body: tableData,
            theme: 'grid',
            styles: { font: "helvetica", fontSize: 9 },
            headStyles: { fillColor: [22, 163, 74] }
        });

        doc.save(`necesar_${dateRange.start}.pdf`);
    };

    const approveAndSend = async () => {
        const toBuy = needs.filter(n => n.to_buy > 0);
        if (toBuy.length === 0) {
            alert("Nu există produse de cumpărat! Lista nu a fost creată.");
            return;
        }

        if (!confirm(`Confirmi crearea unei liste de achiziții cu ${toBuy.length} produse?`)) return;

        setApproving(true);
        try {
            // 1. Create List
            // We need a helper to get current user ID, but simplified: assume admin
            // Ideally we pass user context. For now, we just create it.

            const listName = `Necesar ${dateRange.start} - ${categoryFilter}`;

            const { data: listData, error: listError } = await supabase
                .from('procurement_lists')
                .insert([{
                    name: listName,
                    shopper_id: null, // Unassigned initially
                    status: 'open'
                }])
                .select()
                .single();

            if (listError) throw listError;

            // 2. Add Items
            const items = toBuy.map(item => ({
                list_id: listData.id,
                item_name: item.name,
                quantity_needed: item.to_buy,
                unit: item.unit,
                status: 'pending',
                item_id: item.id // Link to inventory item if possible
            }));

            const { error: itemsError } = await supabase
                .from('procurement_items')
                .insert(items);

            if (itemsError) throw itemsError;

            logAction('GENERARE_NECESAR', `Creat lista ${listName} cu ${items.length} produse.`);
            alert("Lista a fost trimisă la Achiziții cu succes!");
            onClose();

        } catch (err) {
            console.error(err);
            alert("Eroare: " + err.message);
        } finally {
            setApproving(false);
        }
    };

    if (!isOpen) return null;

    const totalCost = needs.reduce((acc, curr) => acc + curr.estimated_cost, 0);
    const productsToBuy = needs.filter(n => n.to_buy > 0).length;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '900px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2><FileText size={24} /> Raport Necesar Consum</h2>
                    <button onClick={onClose} className="close-btn"><X /></button>
                </div>

                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    <div className="report-summary" style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                        <div>
                            <div className="label">Perioada</div>
                            <div className="value">{dateRange.start} : {dateRange.end}</div>
                        </div>
                        <div>
                            <div className="label">Produse Analizate</div>
                            <div className="value">{needs.length}</div>
                        </div>
                        <div>
                            <div className="label">De Cumpărat</div>
                            <div className="value" style={{ color: productsToBuy > 0 ? '#dc2626' : '#16a34a' }}>{productsToBuy}</div>
                        </div>
                        <div>
                            <div className="label">Cost Estimat</div>
                            <div className="value">{totalCost.toFixed(2)} RON</div>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '1rem', marginBottom: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={20} />
                            <span>Eroare calcul: {error}</span>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>Se calculează necesarul...</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Ingredient</th>
                                    <th>Stoc Curent</th>
                                    <th>Necesar Planificat</th>
                                    <th>De Cumpărat</th>
                                    <th>Est. Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {needs.map(item => (
                                    <tr key={item.id} style={{ background: item.to_buy > 0 ? '#fef2f2' : 'white' }}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{item.name}</div>
                                        </td>
                                        <td style={{ color: item.stock < item.required ? '#ef4444' : '#16a34a' }}>
                                            {item.stock.toFixed(2)} {item.unit}
                                        </td>
                                        <td>{item.required.toFixed(2)} {item.unit}</td>
                                        <td>
                                            {item.to_buy > 0 ? (
                                                <span className="badge badge-red" style={{ fontSize: '0.9rem' }}>
                                                    {item.to_buy.toFixed(2)} {item.unit}
                                                </span>
                                            ) : (
                                                <span className="badge badge-green"><Check size={12} /> OK</span>
                                            )}
                                        </td>
                                        <td>{item.estimated_cost > 0 ? `${item.estimated_cost.toFixed(2)} RON` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px',
                            padding: '10px 20px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        Închide
                    </button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={exportPDF}
                            disabled={loading || needs.length === 0}
                            style={{
                                background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: '8px',
                                padding: '10px 20px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', gap: '8px', opacity: (loading || needs.length === 0) ? 0.5 : 1
                            }}
                        >
                            <Download size={18} /> Export PDF
                        </button>
                        <button
                            onClick={approveAndSend}
                            disabled={loading || approving || productsToBuy === 0}
                            style={{
                                background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px',
                                padding: '10px 24px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', gap: '8px', opacity: (loading || approving || productsToBuy === 0) ? 0.5 : 1,
                                boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)'
                            }}
                        >
                            <ShoppingCart size={18} /> {approving ? 'Se trimite...' : 'Aprobă & Trimite la Achiziții'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                .value { font-size: 1.2rem; font-weight: 700; color: #1e293b; }
            `}</style>
        </div>
    );
};

export default ConsumptionReportModal;
