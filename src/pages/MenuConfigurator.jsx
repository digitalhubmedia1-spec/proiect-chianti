import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    Circle,
    Utensils,
    Coffee,
    Wine,
    FileText,
    Cake,
    Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './MenuConfigurator.css';

const MenuConfigurator = () => {
    const navigate = useNavigate();
    const { configuratorSteps, configuratorProducts, loading } = useMenu();

    // Hooks must be called unconditionally
    const [currentStep, setCurrentStep] = useState(1);
    const [selections, setSelections] = useState({
        1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
    });
    const [quantities, setQuantities] = useState({
        1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: ''
    });
    const [modalProduct, setModalProduct] = useState(null);

    // Lucide Icons Map
    const IconMap = {
        'Utensils': Utensils,
        'Coffee': Coffee,
        'Wine': Wine,
        'FileText': FileText,
        'Cake': Cake
    };

    const getIcon = (iconName) => IconMap[iconName] || Utensils;

    if (loading) {
        return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
    }

    // Sort steps by ID to ensure order
    const STEPS = [...configuratorSteps].sort((a, b) => a.id - b.id);


    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const toggleSelection = (stepId, itemId) => {
        setSelections(prev => {
            const currentSelection = prev[stepId] || [];
            const exists = currentSelection.includes(itemId);

            if (exists) {
                return { ...prev, [stepId]: currentSelection.filter(id => id !== itemId) };
            } else {
                return { ...prev, [stepId]: [...currentSelection, itemId] };
            }
        });
    };

    const handleQuantityChange = (stepId, value) => {
        setQuantities(prev => ({ ...prev, [stepId]: value }));
    };

    const openModal = (e, product) => {
        e.stopPropagation(); // Prevent card selection when clicking "See More"
        setModalProduct(product);
    };

    const closeModal = () => {
        setModalProduct(null);
    };

    // Helper to find product by ID across all arrays
    const findProductById = (id) => {
        const allProducts = Object.values(configuratorProducts).flat();
        return allProducts.find(p => p.id === id);
    };

    const generatePDF = async () => {
        const doc = new jsPDF();

        // -- Load Custom Fonts for Diacritics --
        try {
            const [fontRegular, fontBold] = await Promise.all([
                fetch('/fonts/Roboto-Regular.ttf').then(res => res.blob()),
                fetch('/fonts/Roboto-Bold.ttf').then(res => res.blob())
            ]);

            const readFont = (blob) => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });

            const [base64Regular, base64Bold] = await Promise.all([
                readFont(fontRegular),
                readFont(fontBold)
            ]);

            doc.addFileToVFS('Roboto-Regular.ttf', base64Regular);
            doc.addFileToVFS('Roboto-Bold.ttf', base64Bold);

            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

            doc.setFont('Roboto'); // Set as default

            // -- Colors --
            const primaryColor = '#8B0000'; // Dark Red (Chianti-ish)
            const secondaryColor = '#333333';

            // -- Title --
            doc.setFontSize(22);
            doc.setTextColor(primaryColor);
            doc.text("Oferta Meniu Eveniment - Chianti", 105, 20, { align: "center" });

            // -- Date --
            doc.setFontSize(10);
            doc.setTextColor(100);
            const dateStr = new Date().toLocaleDateString('ro-RO');
            doc.text(`Data generării: ${dateStr}`, 105, 28, { align: "center" });

            // -- Table Data Preparation --
            const tableBody = [];
            let grandTotalItems = 0;

            STEPS.forEach(step => {
                // Skip the "Raport Final" step in the loop if we only want product steps
                if (step.id === 8) return;

                const stepQty = quantities[step.id] || '-';
                const stepSelectionIds = selections[step.id] || [];

                if (stepSelectionIds.length > 0) {
                    // Header for the Category
                    tableBody.push([{
                        content: `${step.title} (Porții: ${stepQty})`,
                        colSpan: 2,
                        styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: primaryColor }
                    }]);

                    // Items
                    stepSelectionIds.forEach(itemId => {
                        const product = findProductById(itemId);
                        if (product) {
                            tableBody.push([
                                product.title,
                                product.desc
                            ]);
                        }
                    });
                    grandTotalItems += stepSelectionIds.length;
                }
            });

            if (grandTotalItems === 0) {
                tableBody.push([{ content: "Nu ați selectat niciun produs.", colSpan: 2 }]);
            }

            // -- Generate Table --
            autoTable(doc, {
                startY: 35,
                head: [['Produs', 'Descriere']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: 255, font: 'Roboto', fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 3, font: 'Roboto' },
                columnStyles: {
                    0: { cellWidth: 60, fontStyle: 'bold' },
                    1: { cellWidth: 'auto' }
                }
            });

            // -- Footer / Contact Info --
            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(10);
            doc.setTextColor(secondaryColor);
            doc.text("Vă mulțumim că ați ales Chianti!", 105, finalY, { align: "center" });
            doc.text("Contact: contact@chianti.ro | Telefon: 07xx xxx xxx", 105, finalY + 7, { align: "center" });

            // -- Save --
            doc.save("Oferta_Meniu_Chianti.pdf");

        } catch (error) {
            console.error("Error loading fonts:", error);
            alert("Eroare la încărcarea fonturilor. PDF-ul va fi generat cu font standard.");
        }
    };

    const renderStepContent = () => {
        if (currentStep === 8) {
            // Summary Calculation
            let totalSelections = 0;
            Object.values(selections).forEach(list => totalSelections += list.length);

            return (
                <div className="pdf-preview-section">
                    <h3>Raport Final și Generare Ofertă</h3>
                    <p>Mai jos poți vedea un rezumat al selecțiilor tale.</p>

                    <div className="report-summary-card">
                        <div className="summary-header">
                            <h4>Rezumat Configurare</h4>
                            <span className="badge">{totalSelections} Produse Selectate</span>
                        </div>
                        <ul className="summary-list">
                            {STEPS.map(step => {
                                if (step.id === 8) return null;
                                const count = selections[step.id]?.length || 0;
                                const qty = quantities[step.id];
                                if (count === 0 && !qty) return null;

                                return (
                                    <li key={step.id}>
                                        <strong>{step.title}</strong>
                                        <div className="summary-details">
                                            {qty && <span>Porții: {qty}</span>}
                                            {count > 0 && <span>Produse: {count}</span>}
                                        </div>
                                        {count > 0 && (
                                            <div className="summary-products-list">
                                                {selections[step.id].map(pid => {
                                                    const p = findProductById(pid);
                                                    return p ? <small key={pid}>• {p.title}</small> : null;
                                                })}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="pdf-actions">
                        <p>Dacă totul arată bine, descarcă oferta în format PDF pentru a o prezenta consultanților noștri.</p>
                        <button className="btn btn-primary btn-lg btn-pdf" onClick={generatePDF}>
                            <Download size={20} style={{ marginRight: '8px' }} />
                            Descarcă Ofertă PDF
                        </button>
                    </div>
                </div>
            );
        }

        // Determine current products based on step
        const currentProducts = configuratorProducts[currentStep] || [];
        const currentStepData = STEPS[currentStep - 1];

        if (!currentStepData) {
            return <div>Loading step data...</div>;
        }

        return (
            <div className="step-content">
                <div className="step-header-group">
                    <h3>{currentStepData.title}</h3>

                    <div className="quantity-control">
                        <label htmlFor={`qty-${currentStep}`}>Număr Porții:</label>
                        <input
                            type="number"
                            id={`qty-${currentStep}`}
                            className="qty-input"
                            placeholder="ex: 50"
                            value={quantities[currentStep] || ''}
                            onChange={(e) => handleQuantityChange(currentStep, e.target.value)}
                        />
                    </div>
                </div>

                <p className="step-desc">Selectează produsele dorite pentru această etapă.</p>

                <div className="products-grid-config">
                    {currentProducts.map(product => (
                        <div
                            key={product.id}
                            className={`config-product-card ${selections[currentStep]?.includes(product.id) ? 'selected' : ''}`}
                            onClick={() => toggleSelection(currentStep, product.id)}
                        >
                            <div className="card-chk">
                                {selections[currentStep]?.includes(product.id) ? <CheckCircle size={24} /> : <Circle size={24} />}
                            </div>
                            <div className="card-img-container">
                                <img src={product.image} alt={product.title} />
                            </div>
                            <h4>{product.title}</h4>
                            <p>{product.desc}</p>
                            <button className="btn-see-more" onClick={(e) => openModal(e, product)}>Vezi mai mult</button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="configurator-page">
            {/* Modal */}
            {modalProduct && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="product-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>&times;</button>
                        <div className="modal-image">
                            <img src={modalProduct.image} alt={modalProduct.title} />
                        </div>
                        <div className="modal-content">
                            <h3>{modalProduct.title}</h3>
                            <p className="modal-desc">{modalProduct.fullDesc}</p>
                            <div className="modal-actions">
                                <button className="btn btn-primary" onClick={() => {
                                    if (!selections[currentStep]?.includes(modalProduct.id)) {
                                        toggleSelection(currentStep, modalProduct.id);
                                    }
                                    closeModal();
                                }}>
                                    {selections[currentStep]?.includes(modalProduct.id) ? 'Selectat deja' : 'Selectează Produs'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="configurator-header-hero">
                <div className="container">
                    <h1>Configurator Meniu</h1>
                    <p>Creează-ți propriul meniu personalizat pas cu pas</p>
                </div>
            </div>

            <div className="container configurator-container">
                {/* Sidebar Navigation */}
                <div className="config-sidebar">
                    <ul className="steps-list">
                        {STEPS.map((step) => {
                            const Icon = getIcon(step.iconName);
                            const isActive = step.id === currentStep;
                            const isCompleted = step.id < currentStep;

                            return (
                                <li
                                    key={step.id}
                                    className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                    onClick={() => setCurrentStep(step.id)}
                                >
                                    <div className="step-indicator">
                                        {isCompleted ? <CheckCircle size={20} /> : <span className="step-num">{step.id}</span>}
                                    </div>
                                    <span className="step-title">{step.title}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Main Content */}
                <div className="config-main">
                    {renderStepContent()}

                    <div className="config-footer-nav">
                        <button
                            className="btn btn-outline nav-btn"
                            onClick={handlePrev}
                            disabled={currentStep === 1}
                        >
                            <ChevronLeft size={20} /> Înapoi
                        </button>

                        <button
                            className="btn btn-primary nav-btn"
                            style={{ backgroundColor: '#800020', borderColor: '#800020', marginLeft: '1rem' }}
                            onClick={() => navigate('/saloane')}
                        >
                            Rezervă Salon
                        </button>

                        {currentStep < 8 ? (
                            <button className="btn btn-primary nav-btn" onClick={handleNext}>
                                {currentStep === 7 ? 'Către Raport Final' : 'Pasul Următor'} <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button className="btn btn-primary nav-btn" style={{ visibility: 'hidden' }}>Finalizare</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuConfigurator;
