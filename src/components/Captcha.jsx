import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

const Captcha = ({ onValidate }) => {
    const [captchaCode, setCaptchaCode] = useState('');
    const [userInput, setUserInput] = useState('');
    const canvasRef = useRef(null);

    // Generate random string
    const generateCode = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    };

    const drawCaptcha = (code) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#f2f2f2';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add Noise (Dots)
        ctx.fillStyle = '#bbb';
        for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Add Noise (Lines)
        for (let i = 0; i < 7; i++) {
            ctx.strokeStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Draw Characters
        ctx.font = '24px monospace';
        ctx.fillStyle = '#333';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const x = 20 + i * 25;
            const y = canvas.height / 2;
            const rot = (Math.random() - 0.5) * 0.4; // Random slight rotation

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.fillText(char, 0, 0);
            ctx.restore();
        }
    };

    const refreshCaptcha = () => {
        const newCode = generateCode();
        setCaptchaCode(newCode);
        drawCaptcha(newCode);
        setUserInput('');
        onValidate(false); // Reset validation on refresh
    };

    useEffect(() => {
        refreshCaptcha();
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setUserInput(val);
        // Validate immediately (case insensitive)
        if (val.toLowerCase() === captchaCode.toLowerCase()) {
            onValidate(true);
        } else {
            onValidate(false);
        }
    };

    return (
        <div className="captcha-container" style={{ margin: '1rem 0' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Verificare de Securitate</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <canvas
                    ref={canvasRef}
                    width="180"
                    height="50"
                    style={{ border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={refreshCaptcha}
                    title="Click pentru a reîmprospăta"
                />
                <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="btn-icon"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                    title="Reîmprospătează codul"
                >
                    <RefreshCw size={20} />
                </button>
            </div>
            <input
                type="text"
                className="form-control"
                placeholder="Introdu codul din imagine"
                value={userInput}
                onChange={handleChange}
                style={{ width: '100%' }}
                required
            />
        </div>
    );
};

export default Captcha;
