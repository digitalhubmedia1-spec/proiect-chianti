import React, { useState, useEffect } from 'react';
import { Check, X, Truck, Calendar, User, Phone, Mail, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logAction } from '../../utils/adminLogger';

const DriverApplications = () => {
    const { getDriverApplications, approveDriverApplication, rejectDriverApplication, deleteDriverApplication, getDrivers } = useAuth();
    const [applications, setApplications] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

    useEffect(() => {
        loadData();

        // Listen for updates from other tabs
        const handleStorageChange = (e) => {
            if (e.key === 'chianti_driver_apps_v2') {
                loadData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const loadData = async () => {
        try {
            // Load Drivers for password display
            if (getDrivers) {
                const driversList = await getDrivers();
                setDrivers(driversList || []);
            }

            // Self-healing: Read both new and old storage keys
            const v2Apps = JSON.parse(localStorage.getItem('chianti_driver_apps_v2') || '[]');
            const v1Apps = JSON.parse(localStorage.getItem('chianti_driver_applications') || '[]');

            // Merge unique applications (avoid duplicates by ID)
            const allApps = [...v2Apps];
            let hasChanges = false;

            v1Apps.forEach(oldApp => {
                if (!allApps.some(newApp => newApp.id === oldApp.id)) {
                    allApps.push(oldApp);
                    hasChanges = true;
                }
            });

            // If Supabase is connected, fetch fresh apps too
            if (getDriverApplications) {
                const dbApps = await getDriverApplications();
                if (dbApps && dbApps.length > 0) {
                    // Merge DB apps
                    dbApps.forEach(dbApp => {
                        if (!allApps.some(a => a.id === dbApp.id)) {
                            allApps.push(dbApp);
                            hasChanges = true;
                        } else {
                            // Update status if changed
                            const index = allApps.findIndex(a => a.id === dbApp.id);
                            if (allApps[index].status !== dbApp.status) {
                                allApps[index] = dbApp;
                                hasChanges = true;
                            }
                        }
                    });
                }
            }

            // Sort by date descending (newest first)
            allApps.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

            // If we recovered old data, sync it to the new storage key
            if (hasChanges) {
                localStorage.setItem('chianti_driver_apps_v2', JSON.stringify(allApps));
            }

            setApplications(allApps);
        } catch (err) {
            console.error("Error loading apps:", err);
        }
    };

    const handleApprove = async (app) => {
        if (window.confirm("Ești sigur că vrei să aprobi această aplicație? Se va crea automat un cont de livrator.")) {
            const success = await approveDriverApplication(app);
            if (success) {
                // Remove legacy local app if it exists (by ID matching) to prevent duplication
                // The DB now has the 'approved' version (likely with a NEW ID if migrated, or same if updated)
                // We must remove the OLD local pending item.
                const currentLocal = JSON.parse(localStorage.getItem('chianti_driver_apps_v2') || '[]');
                const newLocal = currentLocal.filter(a => a.id !== app.id); // Remove the specific legacy item

                if (currentLocal.length !== newLocal.length) {
                    localStorage.setItem('chianti_driver_apps_v2', JSON.stringify(newLocal));
                    console.log("Legacy local app removed:", app.id);
                }

                await loadData();
                logAction('LIVRATORI', `Aplicație aprobată: ${app.name || app.email}`);
            }
        }
    };

    const handleReject = async (app) => {
        if (window.confirm("Ești sigur că vrei să respingi această aplicație?")) {
            const success = await rejectDriverApplication(app);
            if (success) {
                // Remove legacy local app if it exists
                const currentLocal = JSON.parse(localStorage.getItem('chianti_driver_apps_v2') || '[]');
                const newLocal = currentLocal.filter(a => a.id !== app.id);

                if (currentLocal.length !== newLocal.length) {
                    localStorage.setItem('chianti_driver_apps_v2', JSON.stringify(newLocal));
                }

                await loadData();
                logAction('LIVRATORI', `Aplicație respinsă: ${app.name || app.email}`);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Ești sigur că vrei să ștergi această aplicație definitiv? Contul de livrator asociat (dacă există) va fi șters.")) {
            await deleteDriverApplication(id);

            // Force remove from local state and storage to reflect changes immediately
            const updatedApps = applications.filter(app => app.id !== id);
            setApplications(updatedApps);
            localStorage.setItem('chianti_driver_apps_v2', JSON.stringify(updatedApps));

            // Also clean legacy storage if present
            const legacyApps = JSON.parse(localStorage.getItem('chianti_driver_applications') || '[]');
            const updatedLegacy = legacyApps.filter(app => app.id !== id);
            localStorage.setItem('chianti_driver_applications', JSON.stringify(updatedLegacy));

            loadData(); // Sync with DB
            logAction('LIVRATORI', `Aplicație ștearsă #${id}`);
        }
    };

    const filteredApps = applications.filter(app => {
        if (filter === 'all') return true;
        return app.status === filter;
    });

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}><Truck className="me-2" style={{ marginRight: '0.5rem' }} /> Aplicații Livratori</h2>
                    <button
                        onClick={loadData}
                        title="Reîmprospătează"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '1px solid #ddd',
                            background: 'white',
                            color: '#333',
                            cursor: 'pointer',
                            padding: 0,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setFilter('pending')}
                        className="btn btn-sm"
                        style={{
                            backgroundColor: filter === 'pending' ? '#800020' : 'white',
                            color: filter === 'pending' ? 'white' : '#800020',
                            borderColor: '#800020',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                        }}
                    >
                        În Așteptare
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className="btn btn-sm"
                        style={{
                            backgroundColor: filter === 'approved' ? '#198754' : 'white',
                            color: filter === 'approved' ? 'white' : '#198754',
                            borderColor: '#198754',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                        }}
                    >
                        Aprobate
                    </button>
                    <button
                        onClick={() => setFilter('rejected')}
                        className="btn btn-sm"
                        style={{
                            backgroundColor: filter === 'rejected' ? '#dc3545' : 'white',
                            color: filter === 'rejected' ? 'white' : '#dc3545',
                            borderColor: '#dc3545',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                        }}
                    >
                        Respinse
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className="btn btn-sm"
                        style={{
                            backgroundColor: filter === 'all' ? '#6c757d' : 'white',
                            color: filter === 'all' ? 'white' : '#6c757d',
                            borderColor: '#6c757d',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                        }}
                    >
                        Toate
                    </button>
                </div>
            </div>

            {filteredApps.length === 0 ? (
                <div className="text-center p-5 bg-light rounded">
                    <p className="text-muted">Nu există aplicații în această categorie.</p>
                </div>
            ) : (
                <div className="row">
                    {filteredApps.map(app => (
                        <div key={app.id} className="col-md-6 col-lg-4 mb-4">
                            <div
                                style={{
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                    background: 'white',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    border: '1px solid #f0f0f0',
                                    borderLeft: `6px solid ${app.status === 'approved' ? '#28a745' : app.status === 'rejected' ? '#800020' : '#cbd5e1'}`,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>

                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
                                                {app.name || `${app.nume || ''} ${app.prenume || ''}`}
                                            </h5>
                                            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.875rem', marginTop: '4px' }}>
                                                <Calendar size={14} style={{ marginRight: '6px' }} />
                                                {new Date(app.created_at || app.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <span
                                            style={{
                                                backgroundColor: app.status === 'approved' ? '#d1e7dd' : app.status === 'rejected' ? '#f8d7da' : '#f1f5f9',
                                                color: app.status === 'approved' ? '#0f5132' : app.status === 'rejected' ? '#842029' : '#475569',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                border: `1px solid ${app.status === 'approved' ? '#badbcc' : app.status === 'rejected' ? '#f5c2c7' : '#e2e8f0'}`,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {app.status === 'pending' ? 'ÎN AȘTEPTARE' : app.status === 'approved' ? 'ADMIS' : 'RESPINS'}
                                        </span>
                                    </div>

                                    <hr style={{ margin: '0.5rem 0', borderColor: '#f1f5f9', borderStyle: 'solid', borderWidth: '1px' }} />

                                    {/* Details */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0 }}>
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.2' }}>Vârstă</div>
                                                <div style={{ color: '#334155', fontWeight: '500' }}>{app.age || app.varsta || '-'} ani</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0 }}>
                                                <Phone size={16} />
                                            </div>
                                            <div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.2' }}>Telefon</div>
                                                <div style={{ color: '#334155', fontWeight: '500' }}>{app.phone || app.telefon}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0 }}>
                                                <Mail size={16} />
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.2' }}>Email</div>
                                                <div style={{ color: '#334155', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={app.email}>{app.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer / Actions */}
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                        {app.status === 'approved' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: '#d1e7dd', color: '#0f5132', fontSize: '0.85rem' }}>
                                                    <Check size={16} style={{ marginRight: '8px' }} />
                                                    <div>
                                                        <strong>Cont Activ</strong> • Pass: {drivers.find(d => d.email === app.email)?.password || 'N/A'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(app.id)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid #fee2e2',
                                                        color: '#ef4444',
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Șterge Aplicația
                                                </button>
                                            </div>
                                        )}

                                        {app.status === 'rejected' && (
                                            <button
                                                onClick={() => handleDelete(app.id)}
                                                style={{
                                                    width: '100%',
                                                    background: '#fee2e2',
                                                    border: '1px solid #fecaca',
                                                    color: '#ef4444',
                                                    padding: '10px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <Trash2 size={16} /> Șterge Definitiv
                                            </button>
                                        )}

                                        {app.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button
                                                    onClick={() => handleApprove(app)}
                                                    style={{
                                                        flex: 1,
                                                        backgroundColor: '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        padding: '10px',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    <Check size={18} style={{ marginRight: '6px' }} /> ADMIS
                                                </button>
                                                <button
                                                    onClick={() => handleReject(app)}
                                                    style={{
                                                        flex: 1,
                                                        backgroundColor: '#800020',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        padding: '10px',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    <X size={18} style={{ marginRight: '6px' }} /> RESPINS
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DriverApplications;
