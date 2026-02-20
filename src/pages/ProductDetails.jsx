import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import ProductExtras from '../components/ProductExtras';
import { isRestaurantOpen } from '../utils/schedule';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { products, categories, loading, fetchRecommendations, fetchDailyMenu } = useMenu();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get('date');
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [isOpen, setIsOpen] = useState(true);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [stock, setStock] = useState(null); // null = unlimited/unknown
    const [dailyMenuMap, setDailyMenuMap] = useState(null);

    const [activeImage, setActiveImage] = useState('');

    // Options State
    const [selectedOptions, setSelectedOptions] = useState({}); // { "Group Name": "Choice Name" }

    useEffect(() => {
        if (loading) return;
        setIsOpen(isRestaurantOpen());
        const foundProduct = products.find(p => p.id === parseInt(id));
        if (foundProduct) {
            setProduct(foundProduct);
            setActiveImage(foundProduct.image);
            setSelectedOptions({}); // Reset options
            // Fetch Stock & Daily Map & Random Recommendations
            const targetDate = dateParam || new Date().toISOString().split('T')[0];
            fetchDailyMenu(targetDate).then(data => {
                const map = {};
                (data || []).forEach(i => map[i.id] = { stock: i.stock, specific_extras_ids: i.specific_extras_ids });
                setDailyMenuMap(map);

                const item = data.find(i => i.id === foundProduct.id);
                if (item && item.stock !== undefined) {
                    setStock(item.stock);
                }

                // Random Recommendations logic:
                // 1. Filter products that are IN the daily menu for this date
                const todaysProducts = products.filter(p => map[p.id] !== undefined);
                // 2. Exclude current product
                const otherProducts = todaysProducts.filter(p => p.id !== foundProduct.id);
                // 3. Shuffle (Fisher-Yates)
                for (let i = otherProducts.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [otherProducts[i], otherProducts[j]] = [otherProducts[j], otherProducts[i]];
                }
                // 4. Take top 4
                setRecommendations(otherProducts.slice(0, 4));
            });

        } else {
            navigate('/produse');
        }
    }, [id, navigate, products, loading, fetchRecommendations, fetchDailyMenu, dateParam]);

    if (loading || !product) return <div className="loading">Se încarcă...</div>;

    const handleOptionSelect = (groupName, choiceName) => {
        setSelectedOptions(prev => ({ ...prev, [groupName]: choiceName }));
    };

    const handleAddToCart = () => {
        if (stock !== null && stock === 0) {
            alert('Produsul nu mai este disponibil.');
            return;
        }

        // Validate Mandatory Options
        // Assuming all defined groups in product_options are mandatory if 'required' isn't explicitly false
        // Or simply act as if all are required for now based on user request "optiuni obligatorii".
        if (product.product_options && Array.isArray(product.product_options)) {
            for (const group of product.product_options) {
                if (!selectedOptions[group.name]) {
                    alert(`Te rog selectează o opțiune pentru: ${group.name}`);
                    return;
                }
            }
        }

        addToCart(product, quantity, selectedOptions);
        alert('Produs adăugat în coș!');
    };

    const isOutOfStock = stock !== null && stock === 0;

    const openImageModal = () => setIsImageModalOpen(true);
    const closeImageModal = () => setIsImageModalOpen(false);

    // Combine main image and gallery for the list
    const allImages = [product.image, ...(product.gallery || [])].filter(Boolean);

    return (
        <div className="product-details-page container">
            <button
                onClick={() => {
                    if (dateParam) {
                        navigate(`/produse?view=catalog&date=${dateParam}`);
                    } else {
                        navigate(-1);
                    }
                }}
                className="btn-back"
            >
                <ArrowLeft size={20} /> Înapoi la Meniu
            </button>

            <div className="product-details-grid">
                <div className="product-image-section">
                    <div className="product-image-large" onClick={openImageModal} style={{ cursor: 'zoom-in', position: 'relative' }}>
                        {stock !== null && stock < 10 && stock > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: '#ef4444',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                zIndex: 10,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                            }}>
                                Doar {stock} porții rămase
                            </div>
                        )}
                        <img src={activeImage || product.image} alt={product.name} style={isOutOfStock ? { filter: 'grayscale(100%)' } : {}} />
                    </div>
                    {/* Gallery Thumbnails */}
                    {allImages.length > 1 && (
                        <div className="product-gallery-thumbnails">
                            {allImages.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Thumbnail ${idx}`}
                                    className={`gallery-thumb ${activeImage === img ? 'active' : ''}`}
                                    onClick={() => setActiveImage(img)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="product-info-detailed">
                    {/* Hide badge for delivery products as requested */}
                    {(() => {
                        const cat = categories.find(c => c.name === product.category);
                        if (cat && cat.type === 'catering') {
                            return <span className="product-category-badge">{product.category}</span>;
                        }
                        return null;
                    })()}
                    <h1 className="product-title-large">{product.name}</h1>
                    <p className="product-price-large">{product.price.toFixed(2)} Lei</p>

                    <p className="product-description-full">{product.description}</p>

                    <div className="product-meta">
                        <p><strong>Gramaj:</strong> {product.weight}</p>
                        {product.ingredients && <p><strong>Ingrediente:</strong> {product.ingredients}</p>}
                        {product.allergens && <p><strong>Alergeni:</strong> {product.allergens}</p>}
                        {stock !== null && (stock < 10 || stock === 0) && (
                            <p style={{ color: stock > 0 ? '#16a34a' : '#ef4444', fontWeight: 'bold', marginTop: '10px' }}>
                                {stock === 0 ? 'Stoc Epuizat' : `Stoc disponibil: ${stock} porții`}
                            </p>
                        )}
                    </div>

                    {/* MANDATORY OPTIONS SECTION */}
                    {product.product_options && Array.isArray(product.product_options) && product.product_options.length > 0 && (
                        <div className="product-options-section" style={{ marginTop: '1.5rem', marginBottom: '3rem', padding: '1rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            {product.product_options.map((group, idx) => (
                                <div key={idx} style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#1f2937' }}>
                                        {group.name} <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>*</span>
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                        {group.choices && group.choices.map((choice, cIdx) => {
                                            const isSelected = selectedOptions[group.name] === choice.name;
                                            return (
                                                <div
                                                    key={cIdx}
                                                    onClick={() => handleOptionSelect(group.name, choice.name)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        border: isSelected ? '2px solid #ef4444' : '1px solid #d1d5db',
                                                        borderRadius: '30px',
                                                        padding: '8px 16px',
                                                        background: isSelected ? '#fff1f2' : 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease',
                                                        minWidth: '80px'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? '700' : '500', textAlign: 'center' }}>{choice.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="add-to-cart-section">
                        <div className="qty-selector" style={{ opacity: isOutOfStock ? 0.5 : 1 }}>
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="qty-btn"
                                disabled={isOutOfStock}
                            >
                                <Minus size={16} />
                            </button>
                            <span className="qty-value">{quantity}</span>
                            <button
                                onClick={() => {
                                    if (stock !== null && quantity >= stock) return;
                                    setQuantity(quantity + 1);
                                }}
                                className="qty-btn"
                                disabled={isOutOfStock || (stock !== null && quantity >= stock)}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className="btn btn-primary btn-add-large"
                            disabled={!isOpen || isOutOfStock}
                            title={!isOpen ? "Restaurantul este închis." : isOutOfStock ? "Produs indisponibil" : ""}
                            style={{
                                opacity: !isOpen || isOutOfStock ? 0.5 : 1,
                                cursor: !isOpen || isOutOfStock ? 'not-allowed' : 'pointer',
                                background: isOutOfStock ? '#94a3b8' : undefined,
                                borderColor: isOutOfStock ? '#94a3b8' : undefined
                            }}
                        >
                            <ShoppingCart size={20} /> {isOutOfStock ? "Stoc Epuizat" : (isOpen ? "Adaugă în Coș" : "Indisponibil")}
                        </button>
                    </div>

                    <ProductExtras productId={product.id} dailyMenuMap={dailyMenuMap} mode="large" />
                </div>
            </div>

            {/* Recommended Products Section */}
            {recommendations.length > 0 && (
                <div className="recommendations-section" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#1a1a1a' }}>Îți recomandăm și...</h2>
                    <div className="recommendations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {recommendations.map(rec => (
                            <div key={rec.id} className="rec-card" onClick={() => navigate(`/produs/${rec.id}`)} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.2s', border: '1px solid #f0f0f0', cursor: 'pointer' }}>
                                <div style={{ height: '140px', overflow: 'hidden' }}>
                                    <img src={rec.image} alt={rec.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem', height: '40px', overflow: 'hidden' }}>{rec.name}</h3>
                                    <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '1rem' }}>{rec.price.toFixed(2)} Lei</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(rec, 1);
                                            // Optional: simple alert or toast
                                        }}
                                        className="btn btn-sm btn-outline-primary"
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                        disabled={!isOpen}
                                    >
                                        <Plus size={16} /> Adaugă
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {isImageModalOpen && (
                <div className="lightbox-overlay" onClick={closeImageModal}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={closeImageModal}>&times;</button>
                        <img src={activeImage || product.image} alt={product.name} className="lightbox-image" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
