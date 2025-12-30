import React from 'react';

const Sidebar = ({ scenarios, onSelect, onNew, onDelete, isOpen, toggleSidebar }) => {
    return (
        <>
            <button
                onClick={toggleSidebar}
                className={`fixed top-6 left-6 z-50 p-2 rounded-full bg-black/80 border border-zinc-800 text-zinc-100 hover:bg-zinc-900 transition-all ${isOpen ? 'hidden' : 'block'}`}
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <div
                className={`fixed inset-y-0 left-0 z-40 w-80 glass-panel border-r-0 transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full p-6">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-light text-white tracking-[0.2em] uppercase">History</h2>
                        <button
                            onClick={toggleSidebar}
                            className="p-2 text-zinc-500 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <button
                        onClick={onNew}
                        className="w-full mb-6 py-4 px-4 glass-button rounded-xl flex items-center justify-center gap-3 transition-all group"
                    >
                        <svg className="w-5 h-5 text-zinc-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-slate-200 font-light tracking-wider text-sm">New Scenario</span>
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                        {scenarios.map((scenario) => (
                            <div
                                key={scenario.id}
                                className="group relative w-full rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all duration-300 shadow-sm"
                            >
                                <button
                                    onClick={() => onSelect(scenario)}
                                    className="w-full text-left p-4 pr-10"
                                >
                                    <div className="text-sm text-slate-300 font-light line-clamp-2 mb-2 group-hover:text-white transition-colors leading-relaxed">
                                        {scenario.input_text}
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                                        {new Date(scenario.created_at).toLocaleDateString()}
                                    </div>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this scenario?')) {
                                            onDelete(scenario.id);
                                        }
                                    }}
                                    className="absolute top-1/2 -translate-y-1/2 right-2 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                                    title="Delete Scenario"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}

                        {scenarios.length === 0 && (
                            <div className="text-center text-slate-600 text-sm mt-10">
                                No history yet.
                            </div>
                        )}
                    </div>


                </div>
            </div>
        </>
    );
};

export default Sidebar;
