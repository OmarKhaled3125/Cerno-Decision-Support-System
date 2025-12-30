import React from 'react';

const BlindSpotCard = ({ critique }) => {
    if (!critique) return null;

    return (
        <div className="w-full max-w-4xl mb-8 animate-fade-in">
            <div className="relative overflow-hidden rounded-xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm p-6">
                {/* Decorative Warning Icon/Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-start gap-4 relaltive z-10">
                    <div className="p-3 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-light text-yellow-200 tracking-wide mb-1">
                            Blind Spot Detected
                        </h3>
                        <p className="text-slate-400 text-sm font-light leading-relaxed mb-4">
                            {critique.critique_summary}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {critique.fallacies?.length > 0 && (
                                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">Logical Fallacies</p>
                                    <ul className="space-y-1">
                                        {critique.fallacies.map((item, idx) => (
                                            <li key={idx} className="text-sm text-slate-300 font-light flex items-start gap-2">
                                                <span className="text-yellow-500 mt-1.5 text-[8px]">●</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {critique.assumptions?.length > 0 && (
                                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">Hidden Assumptions</p>
                                    <ul className="space-y-1">
                                        {critique.assumptions.map((item, idx) => (
                                            <li key={idx} className="text-sm text-slate-300 font-light flex items-start gap-2">
                                                <span className="text-yellow-500 mt-1.5 text-[8px]">●</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlindSpotCard;
