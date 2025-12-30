import { useState } from 'react';

export default function InputForm({ onSubmit, loading }) {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) onSubmit(text);
    };

    return (
        <div className="w-full">
            <div className="relative bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-1 shadow-2xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="relative">
                        <textarea
                            className="w-full h-64 bg-transparent text-lg text-zinc-100 placeholder-zinc-600 p-8 focus:outline-none resize-none leading-relaxed font-light"
                            placeholder="Initialize scenario parameters..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={loading}
                            spellCheck="false"
                        />
                    </div>

                    <div className="border-t border-white/5 p-4 flex justify-between items-center bg-black/20 rounded-b-xl">
                        <button
                            type="button"
                            onClick={() => onSubmit(text, true)} // Pass true for critique mode
                            disabled={loading || !text.trim()}
                            className="text-yellow-500/80 hover:text-yellow-400 text-xs uppercase tracking-widest font-medium transition-colors flex items-center gap-2 hover:bg-yellow-500/10 px-4 py-2 rounded-lg"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Check Blind Spots
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !text.trim()}
                            className="px-8 py-3 rounded-lg bg-white text-black font-medium hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] text-xs uppercase tracking-widest"
                        >
                            {loading ? 'Analyzing...' : 'Execute Analysis'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
