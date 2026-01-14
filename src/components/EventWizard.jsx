import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './EventWizard.css';

const EventWizard = ({ isOpen, onClose, initialType }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [localSubmitted, setLocalSubmitted] = useState(false); // Track if local lead is sent

    // Form States
    const [contact, setContact] = useState({
        nume: '', prenume: '', telefon: '', email: '', adresa: '', data: ''
    });

    // Using Sets or Arrays for checks might be cleaner, but simple objects/arrays work too.
    // We'll use a generic handler for checkboxes to keep code small.
    const [selections, setSelections] = useState({
        eventType: '',
        eventOtherType: '',
        guestCount: '',
        menuOptions: [],
        barOptions: [],
        logistics: [],
        staff: [],
        music: [],
        photoVideo: [],
        decor: [],
        specialMoments: [],
        extraServices: [],
    });

    const [observations, setObservations] = useState('');

    if (!isOpen) return null;

    // --- Handlers ---

    const handleChoice = (selectedChoice) => {
        if (selectedChoice === 'configurator') {
            navigate('/configurator');
        } else {
            // Standard Offer selected
            setStep(2);
        }
    };

    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setContact(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (category, value) => {
        setSelections(prev => {
            const currentList = prev[category];
            if (currentList.includes(value)) {
                return { ...prev, [category]: currentList.filter(item => item !== value) };
            } else {
                return { ...prev, [category]: [...currentList, value] };
            }
        });
    };

    const handleRadioChange = (category, value) => {
        setSelections(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmitLocal = async (e) => {
        e.preventDefault();
        try {
            if (supabase) {
                const { error } = await supabase.from('event_requests').insert([{
                    salon: 'Cerere Saloane Chianti (Lead)',
                    event_type: 'Nespecificat',
                    date_primary: contact.data || null,
                    guests: 0,
                    name: `${contact.nume} ${contact.prenume}`,
                    phone: contact.telefon,
                    email: contact.email,
                    message: JSON.stringify({
                        type: 'Local Venue Interest',
                        contact: { ...contact }
                    })
                }]);

                if (error) throw error;
            }
            // Success - Move to redirect screen
            setLocalSubmitted(true);
        } catch (err) {
            console.error('Error saving local lead:', err);
            alert('A apărut o eroare. Te rugăm să încerci din nou sau să ne contactezi telefonic.');
        }
    };

    const handleSubmitRemote = async (e) => {
        e.preventDefault();
        const fullData = {
            type: 'Remote Event Offer',
            contact,
            selections,
            observations
        };

        try {
            if (supabase) {
                const { error } = await supabase.from('event_requests').insert([{
                    salon: 'Remote (Altă Locație)',
                    event_type: selections.eventType === 'Other' ? selections.eventOtherType : selections.eventType,
                    date_primary: contact.data || null,
                    guests: 0, // Should parse logic but 0 for now as it's a string range
                    name: `${contact.nume} ${contact.prenume}`,
                    phone: contact.telefon,
                    email: contact.email,
                    message: JSON.stringify(fullData)
                }]);

                if (error) {
                    console.error('Supabase error:', error);
                    alert('Eroare la salvarea cererii: ' + error.message);
                    return;
                }
            }
            alert('Formularul a fost trimis! Veți primi o ofertă personalizată pe email.');
            onClose();
        } catch (err) {
            console.error(err);
            alert('A apărut o eroare neașteptată.');
        }
    };

    // --- Content Rendering ---

    const renderLocalFlow = () => {
        if (localSubmitted) {
            return (
                <div className="wizard-step local-redirect-msg">
                    <div className="success-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                    <h2>Mulțumim! Datele au fost înregistrate.</h2>
                    <p>
                        Te rugăm să accesezi acum pagina <strong>Saloane</strong> pentru a vedea detaliile sălilor noastre
                        și pentru a finaliza rezervarea specifică.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/saloane')}
                        style={{ marginTop: '1.5rem' }}
                    >
                        Mergi la Saloane
                    </button>
                </div>
            );
        }

        return (
            <div className="wizard-step step-form">
                <h2>Date de Contact</h2>
                <p className="step-subtitle">Lasă-ne datele tale și te vom ghida spre saloanele noastre.</p>
                <form onSubmit={handleSubmitLocal} className="complex-form">
                    <div className="form-row-2">
                        <div className="form-group">
                            <label>Nume</label>
                            <input type="text" name="nume" value={contact.nume} onChange={handleContactChange} required />
                        </div>
                        <div className="form-group">
                            <label>Prenume</label>
                            <input type="text" name="prenume" value={contact.prenume} onChange={handleContactChange} required />
                        </div>
                    </div>
                    <div className="form-row-2">
                        <div className="form-group">
                            <label>Telefon</label>
                            <input type="tel" name="telefon" value={contact.telefon} onChange={handleContactChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={contact.email} onChange={handleContactChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Data orientativă</label>
                        <input type="date" name="data" value={contact.data} onChange={handleContactChange} required />
                    </div>
                    <button type="submit" className="button btn btn-primary btn-block" style={{ marginTop: '2rem' }}>
                        Continuă spre Saloane
                    </button>
                </form>
            </div>
        );
    };

    const renderRemoteForm = () => (
        <div className="wizard-step step-form">
            <h2>Detalii Eveniment & Ofertă</h2>
            <p className="step-subtitle">Configurează pachetul perfect pentru locația ta.</p>

            <form onSubmit={handleSubmitRemote} className="complex-form">

                {/* 0. Contact Info */}
                <div className="form-section">
                    <h3>0. Date de Contact</h3>
                    <div className="form-row-2">
                        <div className="form-group">
                            <label>Nume</label>
                            <input type="text" name="nume" value={contact.nume} onChange={handleContactChange} required />
                        </div>
                        <div className="form-group">
                            <label>Prenume</label>
                            <input type="text" name="prenume" value={contact.prenume} onChange={handleContactChange} required />
                        </div>
                    </div>
                    <div className="form-row-2">
                        <div className="form-group">
                            <label>Telefon</label>
                            <input type="tel" name="telefon" value={contact.telefon} onChange={handleContactChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={contact.email} onChange={handleContactChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Adresa Locației Evenimentului</label>
                        <input type="text" name="adresa" value={contact.adresa} onChange={handleContactChange} required placeholder="Strada, Număr, Localitate..." />
                    </div>
                    <div className="form-group">
                        <label>Data Dorită</label>
                        <input type="date" name="data" value={contact.data} onChange={handleContactChange} required />
                    </div>
                </div>

                {/* 1. Tip Eveniment */}
                <div className="form-section">
                    <h3>1. Tip Eveniment</h3>
                    <div className="checkbox-group">
                        {['Nuntă', 'Botez', 'Aniversare', 'Corporate'].map(opt => (
                            <label key={opt} className="checkbox-label">
                                <input
                                    type="radio"
                                    name="eventType"
                                    checked={selections.eventType === opt}
                                    onChange={() => handleRadioChange('eventType', opt)}
                                /> {opt}
                            </label>
                        ))}
                        <label className="checkbox-label">
                            <input
                                type="radio"
                                name="eventType"
                                checked={selections.eventType === 'Other'}
                                onChange={() => handleRadioChange('eventType', 'Other')}
                            /> Alt tip:
                            <input
                                type="text"
                                style={{ marginLeft: '10px', padding: '2px 5px', width: '200px' }}
                                value={selections.eventOtherType}
                                onChange={(e) => {
                                    handleRadioChange('eventType', 'Other');
                                    handleRadioChange('eventOtherType', e.target.value);
                                }}
                            />
                        </label>
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Număr estimativ invitați:</label>
                        <select
                            value={selections.guestCount}
                            onChange={(e) => handleRadioChange('guestCount', e.target.value)}
                            required
                        >
                            <option value="">Selectează...</option>
                            <option value="sub 50">Sub 50</option>
                            <option value="50-100">50-100</option>
                            <option value="100-150">100-150</option>
                            <option value="150-170">150-170</option>
                            <option value="200">200 (Info: Doar Salon Roma poate la sediu)</option>
                        </select>
                    </div>
                </div>

                {/* 2. Personalizare Meniu */}
                <div className="form-section">
                    <h3>2. Personalizare Meniu</h3>
                    <div className="checkbox-group">
                        {[
                            'Doresc Pachetul Standard*',
                            'Doresc personalizarea meniului (ajustări)**',
                            'Meniu vegetarian / vegan',
                            'Meniu dedicat copiilor',
                            'Adaptare pentru alergii/intoleranțe',
                            'Degustare meniu (contra cost)'
                        ].map(item => (
                            <label key={item} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selections.menuOptions.includes(item)}
                                    onChange={() => handleCheckboxChange('menuOptions', item)}
                                /> {item}
                            </label>
                        ))}
                    </div>
                    <div className="section-note">
                        * Prin bifarea acestei opțiuni, vei primi variante standard pe email.<br />
                        ** Prin bifarea acestei opțiuni, meniul poate fi personalizat ulterior.
                    </div>
                </div>

                {/* 3. Baruri Tematice */}
                <div className="form-section">
                    <h3>3. Baruri Tematice</h3>
                    <div className="checkbox-group">
                        {['Open bar', 'Candy bar', 'Cheese bar', 'Fruit bar'].map(item => (
                            <label key={item} className="checkbox-label">
                                <input type="checkbox" checked={selections.barOptions.includes(item)} onChange={() => handleCheckboxChange('barOptions', item)} /> {item}
                            </label>
                        ))}
                    </div>
                </div>

                {/* 4. Logistica (ONLY REMOTE) */}
                {initialType === 'remote' && (
                    <div className="form-section">
                        <h3>4. Logistică & Echipamente</h3>
                        <div className="checkbox-group">
                            {['Mese & scaune', 'Fețe de masă & huse', 'Veselă completă', 'Bar mobil', 'Generator curent', 'Transport & montaj'].map(item => (
                                <label key={item} className="checkbox-label">
                                    <input type="checkbox" checked={selections.logistics.includes(item)} onChange={() => handleCheckboxChange('logistics', item)} /> {item}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Personal (ONLY REMOTE) */}
                {initialType === 'remote' && (
                    <div className="form-section">
                        <h3>5. Personal Eveniment</h3>
                        <div className="checkbox-group">
                            {['Bucătari', 'Ospătari', 'Barmani', 'Coordonator eveniment', 'Personal curățenie'].map(item => (
                                <label key={item} className="checkbox-label">
                                    <input type="checkbox" checked={selections.staff.includes(item)} onChange={() => handleCheckboxChange('staff', item)} /> {item}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. Muzica */}
                <div className="form-section">
                    <h3>6. Muzică & Divertisment</h3>
                    <div className="checkbox-group">
                        {['DJ', 'Formație live', 'Sonorizare profesională', 'Lumini scenice', 'Efecte speciale'].map(item => (
                            <label key={item} className="checkbox-label">
                                <input type="checkbox" checked={selections.music.includes(item)} onChange={() => handleCheckboxChange('music', item)} /> {item}
                            </label>
                        ))}
                    </div>
                </div>

                {/* 7. Foto & Video */}
                <div className="form-section">
                    <h3>7. Foto & Video</h3>
                    <div className="checkbox-group">
                        {['Fotograf', 'Videograf', 'Filmare cu dronă', 'Photo corner', 'Cabină foto', 'Album foto personalizat'].map(item => (
                            <label key={item} className="checkbox-label">
                                <input type="checkbox" checked={selections.photoVideo.includes(item)} onChange={() => handleCheckboxChange('photoVideo', item)} /> {item}
                            </label>
                        ))}
                    </div>
                </div>

                {/* 8. Decor */}
                <div className="form-section">
                    <h3>8. Decor & Ambianță</h3>
                    <div className="checkbox-group">
                        {['Decor sală', 'Aranjamente florale', 'Decor mese invitați', 'Panou foto', 'Lumini ambientale', 'Tematică personalizată'].map(item => (
                            <label key={item} className="checkbox-label">
                                <input type="checkbox" checked={selections.decor.includes(item)} onChange={() => handleCheckboxChange('decor', item)} /> {item}
                            </label>
                        ))}
                    </div>
                </div>

                {/* 9. Momente Speciale */}
                <div className="form-section">
                    <h3>9. Momente Speciale</h3>
                    <div className="checkbox-group">
                        {['Tort eveniment', 'Șampanie întâmpinare', 'Foc de artificii', 'Show artistic / dansatori', 'Moment tematic'].map(item => (
                            <label key={item} className="checkbox-label">
                                <input type="checkbox" checked={selections.specialMoments.includes(item)} onChange={() => handleCheckboxChange('specialMoments', item)} /> {item}
                            </label>
                        ))}
                    </div>
                </div>

                {/* 10. Suplimentare */}
                <div className="form-section">
                    <h3>10. Servicii Suplimentare</h3>
                    <div className="checkbox-group">
                        {['Wedding planner', 'Coordonare ziua evenimentului', 'Consultanță organizare', 'Personalizare completă eveniment', 'Invitații & mărturii'].map(item => (
                            <label key={item} className="checkbox-label">
                                <input type="checkbox" checked={selections.extraServices.includes(item)} onChange={() => handleCheckboxChange('extraServices', item)} /> {item}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Observatii */}
                <div className="form-section">
                    <h3>📝 Observații Client</h3>
                    <div className="form-group">
                        <textarea
                            placeholder="Alte detalii importante pentru noi..."
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                <button type="submit" className="button btn btn-primary btn-block">
                    Trimite Solicitarea
                </button>

            </form>
        </div>
    );

    return ReactDOM.createPortal(
        <div className="wizard-overlay">
            <div className="wizard-modal">
                <button className="wizard-close" onClick={onClose}><X size={24} /></button>

                {/* Step 1: Choice */}
                {step === 1 && (
                    <div className="wizard-step step-choice">
                        <h2>Cum dorești să procedezi?</h2>
                        <p className="step-subtitle">Alege varianta potrivită pentru evenimentul tău</p>

                        <div className="choice-cards">
                            <div
                                className="choice-card"
                                onClick={() => handleChoice('configurator')}
                            >
                                <div className="choice-icon">🛠️</div>
                                <h3>Configurez Singur</h3>
                                <p>Vreau să îmi aleg manual preparatele folosind configuratorul interactiv.</p>
                            </div>

                            <div
                                className="choice-card"
                                onClick={() => handleChoice('standard')}
                            >
                                <div className="choice-icon">📋</div>
                                <h3>Ofertă Standard</h3>
                                <p>Vreau o ofertă predefinită de la restaurant pe baza preferințelor mele.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Depends on Type */}
                {step === 2 && (
                    initialType === 'local' ? renderLocalFlow() : renderRemoteForm()
                )}
            </div>
        </div>,
        document.body
    );
};

export default EventWizard;
