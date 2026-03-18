import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Layout from '../layout/Layout';
import { CheckCircle, XCircle, Clock, Loader } from 'lucide-react';

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const navigate = useNavigate();
    
    const [status, setStatus] = useState('loading'); // loading, completed, failed, pending_payment
    const [order, setOrder] = useState(null);

    useEffect(() => {
        if (!orderId) {
            navigate('/');
            return;
        }

        const checkStatus = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (error || !data) {
                console.error("Error fetching order status:", error);
                return;
            }

            setOrder(data);
            setStatus(data.status);

            // If still pending, the webhook might not have fired yet. 
            // We'll let the interval handle the polling.
        };

        checkStatus();

        // Poll every 3 seconds for 30 seconds max
        const interval = setInterval(checkStatus, 3000);
        const timeout = setTimeout(() => clearInterval(interval), 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [orderId, navigate]);

    const renderContent = () => {
        switch (status) {
            case 'completed':
                return (
                    <div className="status-card success">
                        <CheckCircle size={64} color="#22c55e" />
                        <h1>Plată Reușită!</h1>
                        <p>Comanda ta #{orderId} a fost confirmată și este acum în curs de procesare.</p>
                        <p>Vei primi factura pe email în scurt timp.</p>
                        <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Înapoi la Acasă</button>
                    </div>
                );
            case 'failed':
            case 'cancelled':
                return (
                    <div className="status-card error">
                        <XCircle size={64} color="#ef4444" />
                        <h1>Plată Eșuată</h1>
                        <p>Tranzacția pentru comanda #{orderId} nu a putut fi procesată.</p>
                        <p>Te rugăm să încerci din nou sau să alegi altă metodă de plată.</p>
                        <button className="btn btn-primary mt-4" onClick={() => navigate('/checkout')}>Înapoi la Checkout</button>
                    </div>
                );
            case 'pending_payment':
                return (
                    <div className="status-card pending">
                        <Loader className="animate-spin" size={64} color="#f59e0b" />
                        <h1>Se procesează...</h1>
                        <p>Așteptăm confirmarea plății pentru comanda #{orderId}.</p>
                        <p>Te rugăm să nu închizi această pagină.</p>
                    </div>
                );
            default:
                return (
                    <div className="status-card loading">
                        <Loader className="animate-spin" size={64} />
                        <p>Se încarcă detaliile comenzii...</p>
                    </div>
                );
        }
    };

    return (
        <Layout>
            <div className="payment-status-container" style={{ 
                minHeight: '60vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <style>{`
                    .status-card {
                        background: white;
                        padding: 3rem;
                        border-radius: 1rem;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        text-align: center;
                        max-width: 500px;
                        width: 100%;
                    }
                    .status-card h1 { margin: 1.5rem 0 1rem; font-size: 2rem; }
                    .status-card p { color: #666; line-height: 1.6; }
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
                {renderContent()}
            </div>
        </Layout>
    );
};

export default PaymentStatus;
