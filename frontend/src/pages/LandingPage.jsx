import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Background from '../components/Background';
import OverthinkingBackground from '../components/OverthinkingBackground';

const LandingPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState(''); // Used for Login Identifier (Username/Email) or Email for signup
    const [username, setUsername] = useState(''); // Only for Signup
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { loginUser, registerUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (isLogin) {
            // "email" state here acts as the identifier (username or email)
            const result = await loginUser(email, password);
            if (!result.success) setError(result.error);
        } else {
            const result = await registerUser(username, email, password);
            if (!result.success) setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden text-slate-200 font-sans">
            <Background />
            <OverthinkingBackground />

            {/* Left Side - Branding */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center items-start px-20 relative z-10">
                <div className="relative z-10">
                <h1 className="text-8xl font-bold text-white tracking-tighter mb-6 relative">
                    CERNO
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
                </h1>
                <p className="text-xl text-slate-400 font-light tracking-wide leading-relaxed max-w-lg">
                    Advanced Decision Support System. <br />
                    Navigate complexity with clarity. <br />
                    Map your scenarios, analyze conflicts, and discover the golden path.
                </p>
                <div className="mt-12 flex gap-4">
                    <div className="px-4 py-2 border border-white/10 rounded-full text-xs uppercase tracking-widest text-slate-500">v5.1</div>
                    <div className="px-4 py-2 border border-white/10 rounded-full text-xs uppercase tracking-widest text-slate-500">Secure</div>
                </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 relative z-10">
                <div className="w-full max-w-md">
                    {/* Mobile Header */}
                    <div className="lg:hidden text-center mb-10">
                        <h1 className="text-5xl font-bold text-white tracking-tighter mb-2">CERNO</h1>
                        <p className="text-sm text-slate-400 uppercase tracking-widest">Decision Support System</p>
                    </div>

                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                        {/* Tabs */}
                        <div className="flex mb-8 border-b border-white/5 relative">
                            <div className={`absolute bottom-0 h-0.5 bg-white transition-all duration-300 ${isLogin ? 'left-0 w-1/2' : 'left-1/2 w-1/2'}`}></div>
                            <button
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-4 text-sm uppercase tracking-widest font-medium transition-colors ${isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-4 text-sm uppercase tracking-widest font-medium transition-colors ${!isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {!isLogin && (
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 transition-colors"
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">{isLogin ? 'Username or Email' : 'Email'}</label>
                                <input
                                    type={isLogin ? "text" : "email"}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 transition-colors"
                                    placeholder={isLogin ? "Username or Email" : "name@example.com"}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 p-2 rounded">
                                    {error}
                                    {error.toLowerCase().includes('verify your email') && (
                                        <button
                                            type="button"
                                            onClick={() => navigate('/verify-otp', { state: { email: email } })}
                                            className="block w-full mt-2 text-xs uppercase tracking-widest text-white underline hover:text-purple-400"
                                        >
                                            Verify Account
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black font-bold uppercase tracking-widest text-sm py-4 rounded-lg hover:bg-slate-200 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : (isLogin ? 'Enter Cerno' : 'Create Account')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
