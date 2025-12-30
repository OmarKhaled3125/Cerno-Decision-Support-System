import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { deleteAccount } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from './ConfirmModal';

const ProfileMenu = () => {
    const { user, logoutUser } = useAuth();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount();
            showToast('Account deleted successfully', 'success');
            logoutUser();
        } catch (error) {
            showToast('Failed to delete account', 'error');
        }
    };

    const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

    return (
        <>
            <div className="fixed top-6 right-6 z-50 pointer-events-auto" ref={menuRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-10 h-10 rounded-full glass-button flex items-center justify-center text-white hover:bg-white/10 transition-all border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    title="Profile & Settings"
                >
                    <span className="font-light text-sm tracking-widest">{userInitial}</span>
                </button>

                {isOpen && (
                    <div className="absolute top-14 right-0 w-64 glass-panel rounded-xl overflow-hidden animate-fade-in origin-top-right transition-all duration-200 flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-white/5">
                            <p className="text-white text-sm font-medium truncate">
                                {user?.username || 'User'}
                            </p>
                            <p className="text-xs text-slate-400 truncate font-light mt-0.5">
                                {user?.email || 'user@example.com'}
                            </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2 flex flex-col">
                            <div className="px-4 py-1">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setIsDeleteModalOpen(true);
                                    }}
                                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-sm font-light transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Account
                                </button>
                            </div>
                            <div className="px-4 py-1">
                                <button
                                    onClick={logoutUser}
                                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-white/5 hover:text-white text-slate-400 text-sm font-light transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message="Are you sure you want to delete your account? This action is permanent and cannot be undone. All your data will be lost."
                isDanger={true}
            />
        </>
    );
};

export default ProfileMenu;
