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
    const { products, loading } = useMenu();
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(null);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        if (loading) return;
        setIsOpen(isRestaurantOpen());
        const foundProduct = products.find(p => p.id === parseInt(id));
        if (foundProduct) {
            setProduct(foundProduct);
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

    return (
        <div className="product-details-page container">
            <button onClick={() => navigate(-1)} className="btn-back">
                <ArrowLeft size={20} /> Înapoi la Meniu
            </button>

            <div className="product-details-grid">
                <div className="product-image-large">
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
        </div>
    );
};

export default ProductDetails;
