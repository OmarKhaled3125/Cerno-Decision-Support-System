import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgStyles = type === 'error'
        ? 'bg-red-500/10 border-red-500/20 text-red-200'
        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200';

    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-3 rounded-full border backdrop-blur-md shadow-lg animate-fade-in ${bgStyles}`}>
            <span className="text-sm font-medium tracking-wide">{message}</span>
            <button onClick={onClose} className="hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Toast;
