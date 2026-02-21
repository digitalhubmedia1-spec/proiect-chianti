import React, { useState } from 'react';
import { Phone, Clock, MapPin, Utensils, User, Check, Users, ChevronLeft, ChevronRight, X, Image as ImageIcon, UserCog, Info } from 'lucide-react';
import { useMenu } from '../../../context/MenuContext';

const OrderCard = ({ order, showActions = false, onConfirm }) => {
    const { products } = useMenu();
    const [lightboxImages, setLightboxImages] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [instructionModal, setInstructionModal] = useState(null); // { title: '', text: '' }

    const deliveryMethod = order.customer.deliveryMethod;
    const isDelivery = deliveryMethod === 'delivery' || deliveryMethod === 'event-location';
    const isCatering = order.isCatering || deliveryMethod.startsWith('event-');

    let methodLabel = 'Livrare la Domiciliu';
    let methodIcon = <MapPin size={16} style={{ color: '#dc2626' }} />;
    let methodColor = '#dc2626';

    if (deliveryMethod === 'pickup') {
        methodLabel = 'Ridicare Personală';
        methodIcon = <Utensils size={16} style={{ color: '#ea580c' }} />;
        methodColor = '#ea580c';
    } else if (deliveryMethod === 'dinein') {
        methodLabel = 'Servire în Restaurant';
        methodIcon = <Utensils size={16} style={{ color: '#ea580c' }} />;
        methodColor = '#ea580c';
    } else if (deliveryMethod === 'event-restaurant') {
        methodLabel = 'Eveniment la Restaurant';
        methodIcon = <Users size={16} style={{ color: '#7c3aed' }} />;
        methodColor = '#7c3aed';
    } else if (deliveryMethod === 'event-location') {
        methodLabel = 'Eveniment la Locație';
        methodIcon = <MapPin size={16} style={{ color: '#7c3aed' }} />;
        methodColor = '#7c3aed';
    }

    const openGallery = (images) => {
        if (images && images.length > 0) {
            setLightboxImages(images);
            setCurrentImageIndex(0);
        }
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => (prev + 1) % lightboxImages.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length);
    };

    return (
        <div className="order-card-inner" style={{
            background: 'white',
            padding: '1rem', // Reduced padding
        }}>
            {/* Lightbox */}
            {lightboxImages && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setLightboxImages(null)}>

                    <button onClick={(e) => { e.stopPropagation(); setLightboxImages(null); }} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'white' }}>
                        <X size={32} />
                    </button>

                    <button onClick={prevImage} style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', padding: '10px' }}>
                        <ChevronLeft size={32} />
                    </button>

                    <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <img
                            src={lightboxImages[currentImageIndex]}
                            alt={`Gallery ${currentImageIndex}`}
                            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }}
                        />
                        <div style={{ position: 'absolute', bottom: -30, left: 0, right: 0, textAlign: 'center', color: 'white' }}>
                            {currentImageIndex + 1} / {lightboxImages.length}
                        </div>
                    </div>

                    <button onClick={nextImage} style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', padding: '10px' }}>
                        <ChevronRight size={32} />
                    </button>
                </div>
            )}
            {/* Instructions Modal */}
            {
                instructionModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} onClick={() => setInstructionModal(null)}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '500px', width: '90%', position: 'relative' }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => setInstructionModal(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                            <h3 style={{ marginTop: 0, color: '#990000', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{instructionModal.title}</h3>
                            <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                {instructionModal.text}
                            </div>
                            <button onClick={() => setInstructionModal(null)} style={{ marginTop: '1.5rem', width: '100%', padding: '10px', background: '#990000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Am înțeles
                            </button>
                        </div>
                    </div>
                )
            }

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '1.1rem' }}>
                        #{order.orderNumber ? order.orderNumber : order.id.slice(-6)}
                    </span>
                    {order.userId && (
                        <div title="Client Înregistrat" style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '50%',
                            padding: '4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <UserCog size={14} />
                        </div>
                    )}
                    {isCatering && (
                        <span style={{
                            background: '#f3e8ff',
                            color: '#7c3aed',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                        }}>Catering</span>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('ro-RO') : ''}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {order.created_at ? new Date(order.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <User size={18} style={{ color: '#0f172a', marginTop: '2px' }} />
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', lineHeight: '1.2' }}>
                            {order.customer.firstName} {order.customer.lastName}
                        </div>
                        {order.customer.companyName && (
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                                {order.customer.companyName}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Phone size={16} style={{ color: '#059669' }} />
                    <a href={`tel:${order.customer.phone}`} style={{ color: '#0f172a', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500' }}>
                        {order.customer.phone}
                    </a>
                </div>
            </div>

            <div style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                marginBottom: '1rem',
                border: '1px solid #e2e8f0'
            }}>
                {order.items && order.items.map((item, idx) => {
                    const product = products.find(p => p.id === item.id);
                    const productionImages = product?.production_gallery || [];
                    const hasProductionImages = productionImages.length > 0;

                    return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', color: '#334155', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                                {/* Production Image Thumbnail - Larger and at the start */}
                                {hasProductionImages && (
                                    <div
                                        onClick={(e) => { e.stopPropagation(); openGallery(productionImages); }}
                                        style={{
                                            width: '50px', height: '50px', // Smaller
                                            borderRadius: '6px', overflow: 'hidden',
                                            cursor: 'pointer', border: '1px solid #e2e8f0', // Thinner border
                                            flexShrink: 0,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            transition: 'transform 0.2s',
                                            background: '#fff'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                        title="Vezi mod de ambalare"
                                    >
                                        <img
                                            src={productionImages[0]}
                                            alt="Ref"
                                            loading="lazy"
                                            decoding="async"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: hasProductionImages ? '40px' : 'auto', flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: '1rem', lineHeight: '1.4', wordWrap: 'break-word' }}>
                                        <span style={{ fontWeight: '800', marginRight: '6px', color: '#0f172a' }}>{item.quantity}x</span>
                                        {item.name}
                                    </span>
                                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                        <div style={{ fontSize: '0.85rem', color: '#cf3a3a', marginTop: '2px', marginLeft: '4px', fontWeight: '600' }}>
                                            {Object.entries(item.selectedOptions).map(([group, choice]) => (
                                                <div key={group}>• {group}: {choice}</div>
                                            ))}
                                        </div>
                                    )}
                                    {product?.internal_instructions && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInstructionModal({ title: `Instrucțiuni: ${item.name}`, text: product.internal_instructions }); }}
                                            style={{
                                                marginTop: '4px',
                                                background: '#fee2e2', color: '#990000', border: '1px solid #fecaca',
                                                borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem',
                                                display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                                                width: 'fit-content', fontWeight: 'bold'
                                            }}
                                        >
                                            <Info size={14} /> Vezi Instrucțiuni
                                        </button>
                                    )}
                                </div>
                            </div>
                            <span style={{ fontWeight: '700', whiteSpace: 'nowrap', marginLeft: '0.5rem', flexShrink: 0 }}>{(item.price * item.quantity).toFixed(2)} Lei</span>
                        </div>
                    );
                })}
                {/* Show Delivery Cost Line if exists */}
                {order.deliveryCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b', fontStyle: 'italic' }}>
                        <span>Transport ({order.customer.city})</span>
                        <span>{order.deliveryCost.toFixed(2)} Lei</span>
                    </div>
                )}
                <div style={{
                    borderTop: '1px solid #e2e8f0',
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    fontWeight: '800',
                    textAlign: 'right',
                    color: '#0f172a',
                    fontSize: '1.1rem'
                }}>
                    Total: {(order.finalTotal || order.total)?.toFixed(2)} Lei
                </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Delivery Method Label */}
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        {methodIcon}
                        <span style={{ fontWeight: '600', color: methodColor }}>{methodLabel}</span>
                    </div>

                    {/* Address if relevant */}
                    {isDelivery && (
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginLeft: '1.6rem' }}>
                            <span style={{ lineHeight: '1.4' }}>
                                {order.customer.address}, {order.customer.neighborhood} {order.customer.city !== 'Roman' ? `(${order.customer.city})` : ''}
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        <Clock size={16} style={{ color: '#2563eb' }} />
                        <span style={{ fontWeight: '500' }}>Ora: {order.customer.deliveryTime}</span>
                    </div>
                </div>

                {order.customer.details && (
                    <div style={{
                        marginTop: '0.75rem',
                        fontStyle: 'italic',
                        color: '#64748b',
                        padding: '0.5rem 0.75rem',
                        background: '#fff',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.85rem'
                    }}>
                        "{order.customer.details}"
                    </div>
                )}
            </div>

            {
                showActions && (
                    <button
                        onClick={() => onConfirm(order.id)}
                        className="btn"
                        style={{
                            width: '100%',
                            background: '#16a34a',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '1rem',
                            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)'
                        }}
                    >
                        <Check size={18} /> Confirmă Comanda
                    </button>
                )
            }
        </div >
    );
};

export default OrderCard;
