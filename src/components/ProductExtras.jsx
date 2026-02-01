import React, { useState, useEffect } from 'react';
import { useMenu } from '../context/MenuContext';
import { Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductExtras = ({ productId, dailyMenuMap }) => {
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

    // Filter available extras based on Daily Menu logic (if dailyMenuMap provided)
    // If dailyMenuMap is null (standard catalog), maybe show all or check stock? 
    // Usually extras (bread, peppers) are always available or managed via daily menu too.
    // User requirement: "dacă sunt disponibile în ziua respectivă"
    const availableExtras = extras.filter(p => {
        if (!dailyMenuMap) return true; // Fallback or strict? User implied daily context.
        const stock = dailyMenuMap[p.id];
        return stock !== undefined && (stock === null || parseInt(stock) > 0);
    });

    if (loading || availableExtras.length === 0) return null;

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
