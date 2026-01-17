import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { isRestaurantOpen } from '../utils/schedule';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { products, loading, fetchRecommendations } = useMenu();
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [isOpen, setIsOpen] = useState(true);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    useEffect(() => {
        if (loading) return;
        setIsOpen(isRestaurantOpen());
        const foundProduct = products.find(p => p.id === parseInt(id));
        if (foundProduct) {
            setProduct(foundProduct);
            // Fetch recommendations
            fetchRecommendations(foundProduct.id).then(recs => setRecommendations(recs));
        } else {
            navigate('/produse');
        }
    }, [id, navigate, products, loading]);

    if (loading || !product) return <div className="loading">Se încarcă...</div>;

    const handleAddToCart = () => {
        addToCart(product, quantity);
        // Optional: show toast/notification
        alert('Produs adăugat în coș!');
    };

    const openImageModal = () => setIsImageModalOpen(true);
    const closeImageModal = () => setIsImageModalOpen(false);

    return (
        <div className="product-details-page container">
            <button onClick={() => navigate(-1)} className="btn-back">
                <ArrowLeft size={20} /> Înapoi la Meniu
            </button>

            <div className="product-details-grid">
                <div className="product-image-large" onClick={openImageModal} style={{ cursor: 'zoom-in' }}>
                    <img src={product.image} alt={product.name} />
                </div>

                <div className="product-info-detailed">
                    <span className="product-category-badge">{product.category}</span>
                    <h1 className="product-title-large">{product.name}</h1>
                    <p className="product-price-large">{product.price.toFixed(2)} Lei</p>

                    <p className="product-description-full">{product.description}</p>

                    <div className="product-meta">
                        <p><strong>Gramaj:</strong> {product.weight}</p>
                        <p><strong>Ingrediente:</strong> {product.ingredients}</p>
                    </div>

                    <div className="add-to-cart-section">
                        <div className="qty-selector">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="qty-btn"><Minus size={16} /></button>
                            <span className="qty-value">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="qty-btn"><Plus size={16} /></button>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className="btn btn-primary btn-add-large"
                            disabled={!isOpen}
                            title={!isOpen ? "Restaurantul este închis." : ""}
                            style={{ opacity: !isOpen ? 0.5 : 1, cursor: !isOpen ? 'not-allowed' : 'pointer' }}
                        >
                            <ShoppingCart size={20} /> {isOpen ? "Adaugă în Coș" : "Indisponibil"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Recommended Products Section */}
            {recommendations.length > 0 && (
                <div className="recommendations-section" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#1a1a1a' }}>Îți recomandăm și...</h2>
                    <div className="recommendations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {recommendations.map(rec => (
                            <div key={rec.id} className="rec-card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.2s', border: '1px solid #f0f0f0' }}>
                                <div style={{ height: '140px', overflow: 'hidden' }}>
                                    <img src={rec.image} alt={rec.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem', height: '40px', overflow: 'hidden' }}>{rec.name}</h3>
                                    <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '1rem' }}>{rec.price.toFixed(2)} Lei</p>
                                    <button
                                        onClick={() => {
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
                        <img src={product.image} alt={product.name} className="lightbox-image" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
