import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Background from '../components/Background';
import axios from 'axios';

const OTPPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { verifyOTP } = useAuth();
    const email = location.state?.email;
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    if (!email) {
        navigate('/'); // Redirect if no email in state
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await verifyOTP(email, code);
        if (!result.success) {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleResend = async () => {
        setMessage('');
        setError('');
        try {
            await axios.post('http://127.0.0.1:8000/api/auth/resend-otp/', { email });
            setMessage('Verification code resent.');
        } catch (err) {
            setError('Failed to resend code.');
        }
    };

    return (
        <div className="min-h-screen w-full flex justify-center items-center relative overflow-hidden text-slate-200 font-sans">
            <Background />

            <div className="relative z-10 w-full max-w-md px-6">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
                    <h2 className="text-2xl font-bold text-white tracking-wide mb-2">Verify Identity</h2>
                    <p className="text-slate-400 text-sm mb-8">Enter the code sent to {email}</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-center text-2xl tracking-[0.5em] text-white placeholder-slate-700 focus:outline-none focus:border-white/30 transition-colors"
                            placeholder="······"
                            maxLength={6}
                            required
                        />

                        {error && (
                            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-2 rounded">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 p-2 rounded">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-bold uppercase tracking-widest text-sm py-4 rounded-lg hover:bg-slate-200 transition-transform active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify Access'}
                        </button>
                    </form>

                    <button
                        onClick={handleResend}
                        className="mt-6 text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                    >
                        Resend Code
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OTPPage;
