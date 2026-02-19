import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VisualHallViewer from '../components/VisualHallViewer';
import { Calendar, Clock, MapPin, Users, CheckCircle, ArrowRight } from 'lucide-react';

const ReservationPage = () => {
    const { token } = useParams();
    const [event, setEvent] = useState(null);
    const [hall, setHall] = useState(null);
    const [objects, setObjects] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [locks, setLocks] = useState([]); // Kept empty for compatibility
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Selection State
    const [selectedTable, setSelectedTable] = useState(null);
    const [seatCount, setSeatCount] = useState(1);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '' });
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

        return () => {
            supabase.removeChannel(subReservations);
        };
    }, [event]);

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
    };

    const formRef = React.useRef(null);

    const getRemainingSeats = (tableId) => {
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

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', background: '#f9fafb', minHeight: '100vh' }}>Se încarcă evenimentul...</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444', background: '#f9fafb', minHeight: '100vh' }}>{error}</div>;
    if (success) return (
        <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', textAlign: 'center', background: 'white', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={48} color="#16a34a" />
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Rezervare Confirmată!</h1>
                <p style={{ color: '#4b5563', marginBottom: '2rem', fontSize: '1.1rem' }}>Te așteptăm cu drag la evenimentul <strong>{event.name}</strong>.</p>
                
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '16px', textAlign: 'left', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#6b7280' }}>Nume:</span>
                        <span style={{ fontWeight: '600', color: '#111827' }}>{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#6b7280' }}>Masa:</span>
                        <span style={{ fontWeight: '600', color: '#111827' }}>{selectedTable?.label}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Locuri:</span>
                        <span style={{ fontWeight: '600', color: '#111827' }}>{seatCount} persoane</span>
                    </div>
                </div>
                
                <button onClick={() => window.location.reload()} style={{ width: '100%', padding: '14px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Închide
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
            {/* Hero Header */}
            <div style={{ 
                background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', 
                color: 'white', 
                padding: '3rem 1rem 6rem',
                textAlign: 'center',
                position: 'relative'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: isMobile ? '2rem' : '2.75rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.025em', lineHeight: '1.2' }}>{event.name}</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: isMobile ? '0.9rem' : '1.1rem', opacity: 0.9, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={18} /> {new Date(event.start_date).toLocaleDateString('ro-RO')}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18} /> {new Date(event.start_date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={18} /> Salon {event.event_halls?.name}</span>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '-4rem auto 2rem', padding: '0 1rem', position: 'relative', zIndex: 10 }}>
                <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
                    
                    {/* Visual Layout Card */}
                    <div style={{ background: 'white', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={20} className="text-blue-600" style={{color: '#2563eb'}} /> 
                                Alege Masa
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', background: '#f3f4f6', padding: '6px 12px', borderRadius: '20px', fontWeight: '500' }}>
                                {isMobile ? 'Apasă pe masă' : 'Click pe masă'}
                            </span>
                        </div>
                        
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem', display: isMobile ? 'block' : 'none', background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #dbeafe', color: '#1e40af' }}>
                            💡 <strong>Sfat:</strong> Folosește două degete pentru a mări sau mișca harta sălii.
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

                    {/* Sidebar Form Card */}
                    <div ref={formRef}>
                        <div style={{ 
                            background: 'white', 
                            padding: '2rem', 
                            borderRadius: '20px', 
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                            position: isMobile ? 'relative' : 'sticky', 
                            top: '2rem',
                            border: '1px solid #f3f4f6'
                        }}>
                            {!selectedTable ? (
                                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <Users size={40} style={{ opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Nicio masă selectată</h3>
                                    <p style={{ fontSize: '0.95rem' }}>Selectează o masă liberă (verde) din plan pentru a începe rezervarea.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Masă Selectată</span>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>{selectedTable.label}</h3>
                                        </div>
                                        <button type="button" onClick={handleCancelSelection} style={{ fontSize: '0.85rem', color: '#ef4444', background: '#fef2f2', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Anulează</button>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Număr Locuri</label>
                                        <div style={{ position: 'relative' }}>
                                            <select 
                                                value={seatCount} 
                                                onChange={e => setSeatCount(parseInt(e.target.value))}
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', background: '#fff', appearance: 'none', cursor: 'pointer' }}
                                            >
                                                {[...Array(Math.min(10, getRemainingSeats(selectedTable.id))).keys()].map(i => (
                                                    <option key={i+1} value={i+1}>{i+1} persoane</option>
                                                ))}
                                            </select>
                                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '6px' }}>
                                            Disponibil: {getRemainingSeats(selectedTable.id)} locuri
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Nume</label>
                                            <input 
                                                required
                                                placeholder="Popescu"
                                                value={formData.lastName}
                                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Prenume</label>
                                            <input 
                                                required
                                                placeholder="Ion"
                                                value={formData.firstName}
                                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Telefon</label>
                                        <input 
                                            required
                                            placeholder="07xxxxxxxx"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', boxSizing: 'border-box' }}
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        style={{ 
                                            width: '100%', padding: '16px', 
                                            background: 'linear-gradient(to right, #2563eb, #1d4ed8)', 
                                            color: 'white', border: 'none', borderRadius: '12px', 
                                            fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer',
                                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)',
                                            transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        Confirmă Rezervarea <ArrowRight size={20} />
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
