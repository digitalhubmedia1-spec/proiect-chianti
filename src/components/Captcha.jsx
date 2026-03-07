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
        <div className="captcha-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '2px solid white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <canvas
                        ref={canvasRef}
                        width="180"
                        height="50"
                        style={{ display: 'block', cursor: 'pointer', background: '#f1f5f9' }}
                        onClick={refreshCaptcha}
                        title="Click pentru a reîmprospăta"
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)' }}></div>
                </div>
                <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="btn btn-light shadow-sm p-2 rounded-circle"
                    style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'white' }}
                    title="Reîmprospătează codul"
                >
                    <RefreshCw size={20} className="text-muted" />
                </button>
            </div>
            <input
                type="text"
                className="form-control bg-white border-0 py-2 shadow-sm"
                placeholder="Introdu codul din imagine"
                value={userInput}
                onChange={handleChange}
                style={{ borderRadius: '10px', fontSize: '0.9rem' }}
            />
        </div>
    );
};

export default Captcha;
