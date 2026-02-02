import React, { useState, useEffect } from 'react';
import { useMenu } from '../context/MenuContext';
import { Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductExtras = ({ productId, dailyMenuMap, mode = 'small' }) => {
    const { fetchExtras } = useMenu();
    const { addToCart } = useCart();
    const [extras, setExtras] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const data = await fetchExtras(productId);
            if (mounted) {
                setExtras(data);
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [productId, fetchExtras]);

    // User requirement: "dacă sunt disponibile în ziua respectivă"
    // However, some extras (bread, etc.) might not be explicitly in daily menu.
    // Fallback: If in daily menu -> check stock. If NOT in daily menu -> check global is_available.
    const availableExtras = extras.filter(p => {
        // If map not loaded yet, wait or show? (Loading state handles this)
        if (!dailyMenuMap) return p.is_available !== false;

        const stock = dailyMenuMap[p.id];
        if (stock !== undefined) {
            // In daily menu: check stock
            return stock === null || parseInt(stock) > 0;
        }
        // Not in daily menu: fallback to global availability
        return p.is_available !== false;
    });

    if (loading || availableExtras.length === 0) return null;

    if (mode === 'large') {
        return (
            <div className="product-extras-large" style={{ marginTop: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                    🍽️ Completează masa cu:
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                    {availableExtras.map(extra => (
                        <div key={extra.id} onClick={(e) => { e.stopPropagation(); addToCart(extra); }}
                            style={{
                                background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px',
                                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#16a34a'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                            {extra.image ? (
                                <img src={extra.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px', border: '2px solid #f1f5f9' }} />
                            ) : (
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🥘</div>
                            )}
                            <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#334155', lineHeight: '1.2', marginBottom: '4px' }}>{extra.name}</span>
                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.9rem' }}>+ {extra.price.toFixed(2)} Lei</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="product-extras-section" style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px dashed #e2e8f0',
            fontSize: '0.85rem'
        }}>
            <div style={{
                fontWeight: '600',
                color: '#166534',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                <span style={{ fontSize: '1rem' }}>💡</span>
                Clienții au mai adăugat:
            </div>
            <div className="extras-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {availableExtras.map(extra => (
                    <div key={extra.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            addToCart(extra);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '12px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            maxWidth: '100%'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
                        title={`Adaugă ${extra.name} - ${extra.price} Lei`}
                    >
                        {extra.image && (
                            <img src={extra.image} alt="" style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} />
                        )}
                        <span style={{ fontWeight: '500', color: '#14532d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                            {extra.name}
                        </span>
                        <div style={{
                            background: '#16a34a',
                            color: 'white',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Plus size={10} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductExtras;
