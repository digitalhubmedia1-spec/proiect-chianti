import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VisualHallViewer from '../components/VisualHallViewer';
import { Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';

const ReservationPage = () => {
    const { token } = useParams();
    const [event, setEvent] = useState(null);
    const [hall, setHall] = useState(null);
    const [objects, setObjects] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [locks, setLocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Selection State
    const [selectedTable, setSelectedTable] = useState(null);
    const [seatCount, setSeatCount] = useState(1);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '' });
    const [lockExpiry, setLockExpiry] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        loadEventData();
    }, [token]);

    // Realtime updates
    useEffect(() => {
        if (!event) return;

        const subReservations = supabase.channel('public:event_reservations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_reservations', filter: `event_id=eq.${event.id}` }, () => fetchAvailability())
            .subscribe();

        const subLocks = supabase.channel('public:event_reservation_locks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_reservation_locks', filter: `event_id=eq.${event.id}` }, () => fetchAvailability())
            .subscribe();

        return () => {
            supabase.removeChannel(subReservations);
            supabase.removeChannel(subLocks);
        };
    }, [event]);

    // Timer for lock expiry - REMOVED

    const loadEventData = async () => {
        try {
            setLoading(true);
            // Fetch Event by Token
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*, event_halls(*)')
                .eq('reservation_token', token)
                .single();

            if (eventError || !eventData) throw new Error("Evenimentul nu a fost găsit sau link-ul este invalid.");
            setEvent(eventData);
            setHall(eventData.event_halls);

            // Fetch Layout Objects
            const { data: objData } = await supabase
                .from('event_layout_objects')
                .select('*')
                .eq('event_id', eventData.id);
            setObjects(objData || []);

            await fetchAvailability(eventData.id);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailability = async (eventIdParam) => {
        const eid = eventIdParam || event?.id;
        if (!eid) return;

        const { data: resData } = await supabase.from('event_reservations').select('*').eq('event_id', eid);
        setReservations(resData || []);
        
        // Locks not needed anymore
        setLocks([]);
    };

    const formRef = React.useRef(null);

    const getRemainingSeats = (tableId) => {
        // Force string comparison just in case
        const tid = tableId.toString();
        const reserved = reservations
            .filter(r => r.table_id.toString() === tid && r.status === 'confirmed')
            .reduce((sum, r) => sum + r.seat_count, 0);
        
        const obj = objects.find(o => o.id.toString() === tid);
        const capacity = obj?.capacity || 10;
        return Math.max(0, capacity - reserved);
    };

    const handleTableSelect = (table) => {
        const remaining = getRemainingSeats(table.id);
        if (remaining <= 0) {
            alert("Această masă este complet ocupată.");
            return;
        }

        setSelectedTable(table);
        setSeatCount(1);

        // Scroll to form on mobile
        if (isMobile && formRef.current) {
            setTimeout(() => formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    };

    const handleCancelSelection = () => {
        setSelectedTable(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            alert("Toate câmpurile sunt obligatorii.");
            return;
        }
        if (!/^07\d{8}$/.test(formData.phone)) {
            alert("Numărul de telefon trebuie să fie un număr valid de România (07xxxxxxxx).");
            return;
        }

        // Double check availability before submit
        const remaining = getRemainingSeats(selectedTable.id);
        if (seatCount > remaining) {
            alert(`Din păcate au mai rămas doar ${remaining} locuri disponibile la această masă.`);
            return;
        }

        const fullName = `${formData.firstName} ${formData.lastName}`;

        const { error: insertError } = await supabase.from('event_reservations').insert([{
            event_id: event.id,
            table_id: selectedTable.id,
            guest_name: fullName,
            guest_phone: formData.phone,
            seat_count: seatCount,
            status: 'confirmed'
        }]);

        if (insertError) {
            alert("Eroare la rezervare: " + insertError.message);
        } else {
            setSuccess(true);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>Se încarcă evenimentul...</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</div>;
    if (success) return (
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CheckCircle size={64} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>Rezervare Confirmată!</h1>
            <p style={{ color: '#4b5563', marginBottom: '2rem' }}>Te așteptăm cu drag la evenimentul <strong>{event.name}</strong>.</p>
            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'left', display: 'inline-block' }}>
                <p><strong>Nume:</strong> {formData.firstName} {formData.lastName}</p>
                <p><strong>Masa:</strong> {selectedTable?.label}</p>
                <p><strong>Locuri:</strong> {seatCount}</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>{event.name}</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', color: '#6b7280', fontSize: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={18} /> {new Date(event.start_date).toLocaleDateString('ro-RO')}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18} /> {new Date(event.start_date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={18} /> Salon {event.event_halls?.name}</span>
                    </div>
                </div>

                <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                    {/* Visual Layout */}
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Alege Masa</h3>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem', display: isMobile ? 'block' : 'none' }}>
                            💡 Folosește două degete pentru zoom și mișcare. Apasă pe o masă verde pentru a selecta.
                        </p>
                        <VisualHallViewer 
                            hall={hall} 
                            objects={objects} 
                            reservations={reservations} 
                            locks={locks}
                            onTableSelect={handleTableSelect}
                            selectedTableId={selectedTable?.id}
                        />
                    </div>

                    {/* Sidebar Form */}
                    <div ref={formRef}>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: isMobile ? 'relative' : 'sticky', top: '2rem' }}>
                            {!selectedTable ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
                                    <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p>Selectează o masă liberă (verde) din plan pentru a începe rezervarea.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Rezervare {selectedTable.label}</h3>
                                        <button type="button" onClick={handleCancelSelection} style={{ fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Anulează</button>
                                    </div>

                                    {lockExpiry && (
                                        <div style={{ background: '#fff7ed', color: '#9a3412', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                                            Locul este blocat pentru tine timp de <strong>{Math.ceil((lockExpiry - new Date()) / 60000)} minute</strong>.
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>Număr Locuri</label>
                                        <select 
                                            value={seatCount} 
                                            onChange={e => setSeatCount(parseInt(e.target.value))}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        >
                                            {[...Array(Math.min(10, getRemainingSeats(selectedTable.id))).keys()].map(i => (
                                                <option key={i+1} value={i+1}>{i+1} persoane</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>Nume</label>
                                            <input 
                                                required
                                                value={formData.lastName}
                                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>Prenume</label>
                                            <input 
                                                required
                                                value={formData.firstName}
                                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '6px' }}>Telefon</label>
                                        <input 
                                            required
                                            placeholder="07xxxxxxxx"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        style={{ width: '100%', padding: '12px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
                                    >
                                        Confirmă Rezervarea
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationPage;
