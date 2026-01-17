import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { logAction } from '../../../utils/adminLogger';
import { Eye, EyeOff, Edit2, Check, X, Trash2 } from 'lucide-react';

const AdminOperators = () => {
    const [operators, setOperators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    // State to toggle password visibility per row
    const [visiblePasswords, setVisiblePasswords] = useState({});

    useEffect(() => {
        fetchOperators();
    }, []);

    const fetchOperators = async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .order('role', { ascending: true });

        if (error) {
            console.error("Error fetching operators:", error);
        } else {
            setOperators(data || []);
        }
        setLoading(false);
    };

    const togglePasswordVisibility = (id) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const startEditing = (op) => {
        setEditingId(op.id);
        setEditName(op.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveOperator = async (id) => {
        if (!editName.trim()) return;

        const { error } = await supabase
            .from('admin_users')
            .update({ name: editName })
            .eq('id', id);

        if (error) {
            alert("Eroare la salvare: " + error.message);
        } else {
            setOperators(prev => prev.map(op => op.id === id ? { ...op, name: editName } : op));
            setEditingId(null);
            logAction('OPERATORI', `Actualizare nume #${id} -> ${editName}`);
        }
    };

    // Helper to translate roles
    const getRoleName = (role) => {
        switch (role) {
            case 'admin_app': return 'Administrator Aplicație';
            case 'operator': return 'Operator';
            case 'chef': return 'Bucătar';
            default: return role;
        }
    };

    if (loading) return <div className="p-4">Se încarcă operatorii...</div>;

    return (
        <div className="admin-operators-section">
            <h2 className="section-title">Gestionare Operatori</h2>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nume</th>
                            <th>Utilizator</th>
                            <th>Parolă (Afișare)</th>
                            <th>Rol</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operators.map(op => (
                            <tr key={op.id} style={{ opacity: op.role === 'admin_app' ? 0.9 : 1 }}>
                                <td>
                                    {editingId === op.id ? (
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                    ) : (
                                        <span style={{ fontWeight: op.role === 'admin_app' ? 'bold' : 'normal', color: op.role === 'admin_app' ? '#dc2626' : 'inherit' }}>
                                            {op.name}
                                        </span>
                                    )}
                                </td>
                                <td>{op.username}</td>
                                <td>
                                    {op.role === 'admin_app' ? (
                                        <span className="text-muted">Ascuns (Securizat)</span>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>
                                                {visiblePasswords[op.id] ? op.password : '••••••••'}
                                            </span>
                                            <button
                                                className="btn-icon-small"
                                                onClick={() => togglePasswordVisibility(op.id)}
                                                title={visiblePasswords[op.id] ? "Ascunde" : "Arată"}
                                            >
                                                {visiblePasswords[op.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <span className={`badge badge-${op.role}`}>
                                        {getRoleName(op.role)}
                                    </span>
                                </td>
                                <td>
                                    {op.role !== 'admin_app' && (
                                        <div className="actions-cell">
                                            {editingId === op.id ? (
                                                <>
                                                    <button className="btn-icon success" onClick={() => saveOperator(op.id)} title="Salvează">
                                                        <Check size={18} />
                                                    </button>
                                                    <button className="btn-icon danger" onClick={cancelEditing} title="Anulează">
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button className="btn-icon primary" onClick={() => startEditing(op)} title="Editează Nume">
                                                    <Edit2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {op.role === 'admin_app' && (
                                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Protejat</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="operator-info-box mt-4 p-3 bg-light rounded">
                <h4>ℹ️ Informații Roluri</h4>
                <ul>
                    <li><strong>Administrator Aplicație:</strong> Acces total. Nu poate fi șters sau editat din panou.</li>
                    <li><strong>Operator:</strong> Acces la Produse, Comenzi, Categorii, etc. Poate modifica numele contului său.</li>
                    <li><strong>Bucătar:</strong> Acces strict limitat la secțiunea "Comenzi" pentru a vedea ce trebuie gătit.</li>
                </ul>
            </div>
        </div>
    );
};

export default AdminOperators;
