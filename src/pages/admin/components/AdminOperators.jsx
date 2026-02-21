import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { logAction } from '../../../utils/adminLogger';
import { Eye, EyeOff, Edit2, Check, X, Trash2, Plus } from 'lucide-react';

const AdminOperators = () => {
    const [operators, setOperators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [currentUserRole, setCurrentUserRole] = useState(null);

    // State to toggle password visibility per row - REMOVED for Security
    // const [visiblePasswords, setVisiblePasswords] = useState({});

    // Add Operator State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newOp, setNewOp] = useState({ name: '', username: '', password: '', role: 'operator' });

    useEffect(() => {
        const role = localStorage.getItem('admin_role');
        setCurrentUserRole(role);
        fetchOperators();
    }, []);

    const fetchOperators = async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, name, username, role, created_at')
            .order('role', { ascending: true });

        if (error) {
            console.error("Error fetching operators:", error);
        } else {
            setOperators(data || []);
        }
        setLoading(false);
    };

    /* const togglePasswordVisibility = (id) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    }; */

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

    const deleteOperator = async (id, role) => {
        if (role === 'admin_app') {
            alert("Nu puteți șterge un administrator!");
            return;
        }
        if (!window.confirm("Sigur doriți să ștergeți acest cont?")) return;

        const { error } = await supabase
            .from('admin_users')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Eroare la ștergere: " + error.message);
        } else {
            setOperators(prev => prev.filter(op => op.id !== id));
            logAction('OPERATORI', `Șters utilizator #${id}`);
        }
    };

    const createOperator = async (e) => {
        e.preventDefault();
        if (!newOp.name || !newOp.username || !newOp.password) {
            alert("Toate câmpurile sunt obligatorii!");
            return;
        }

        const { data, error } = await supabase
            .from('admin_users')
            .insert([newOp])
            .select()
            .single();

        if (error) {
            alert("Eroare la creare: " + error.message);
        } else {
            setOperators([...operators, data]);
            setIsAddOpen(false);
            setNewOp({ name: '', username: '', password: '', role: 'operator' });
            logAction('OPERATORI', `Creat utilizator nou: ${data.name} (${data.role})`);
        }
    };

    // Helper to translate roles
    const getRoleName = (role) => {
        switch (role) {
            case 'admin_app': return 'Administrator Aplicație';
            case 'operator': return 'Operator';
            case 'chef': return 'Bucătar';
            case 'contabil': return 'Contabil';
            case 'achizitor': return 'Achizitor';
            default: return role;
        }
    };

    if (loading) return <div className="p-4">Se încarcă operatorii...</div>;

    return (
        <div className="admin-operators-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Gestionare Operatori</h2>
                {currentUserRole === 'admin_app' && (
                    <button
                        className="btn-primary"
                        onClick={() => setIsAddOpen(true)}
                        style={{ background: '#22c55e', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <Plus size={18} /> Adaugă Operator
                    </button>
                )}
            </div>

            {isAddOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>Operator Nou</h3>
                        <form onSubmit={createOperator} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>Nume (Persoană)</label>
                                <input
                                    type="text"
                                    value={newOp.name}
                                    onChange={e => setNewOp({ ...newOp, name: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    placeholder="ex: Ion Popescu"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>Username (Login)</label>
                                <input
                                    type="text"
                                    value={newOp.username}
                                    onChange={e => setNewOp({ ...newOp, username: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    placeholder="ex: ion.popescu"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>Parolă</label>
                                <input
                                    type="text"
                                    value={newOp.password}
                                    onChange={e => setNewOp({ ...newOp, password: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    placeholder="ex: 1234"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>Rol</label>
                                <select
                                    value={newOp.role}
                                    onChange={e => setNewOp({ ...newOp, role: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="operator">Operator (General)</option>
                                    <option value="chef">Bucătar</option>
                                    <option value="achizitor">Achizitor</option>
                                    <option value="contabil">Contabil</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsAddOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Anulează</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Creează</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nume</th>
                            <th>Utilizator</th>
                            <th>Parolă</th>
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
                                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '1.2em', letterSpacing: '2px' }}>
                                        ••••••••
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge badge-${op.role}`}>
                                        {getRoleName(op.role)}
                                    </span>
                                </td>
                                <td>
                                    {op.role !== 'admin_app' && currentUserRole === 'admin_app' ? (
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
                                                <>
                                                    <button className="btn-icon primary" onClick={() => startEditing(op)} title="Editează Nume">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button className="btn-icon danger" onClick={() => deleteOperator(op.id, op.role)} title="Șterge Cont">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                            {op.role === 'admin_app' ? 'Protejat' : 'Vizualizare'}
                                        </span>
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
                    <li><strong>Operator:</strong> Acces general (Comenzi, Produse, Categorii).</li>
                    <li><strong>Contabil:</strong> Acces la Rapoarte, Stocuri, Loguri, Inventar.</li>
                    <li><strong>Achizitor:</strong> Acces la Furnizori, Recepții, Stocuri, Transferuri.</li>
                    <li><strong>Bucătar:</strong> Acces strict limitat la secțiunea "Comenzi".</li>
                </ul>
            </div>
        </div>
    );
};

export default AdminOperators;
