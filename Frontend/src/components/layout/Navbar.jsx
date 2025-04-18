import React, { useState } from 'react';
import { LogOut, Settings, Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import UpdateDetailsModal from '../shared/UpdateDetailsModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../contexts/AuthContext';
import useClickOutside from '../../hooks/useClickOutside';
import Button from '../common/Button';
import PlaceholderAvatar from '../../assets/svgs/placeholder-image.svg';
import { useToast } from "../../hooks/useToast";

const LogoIcon = () => (
    <Link to="/explore" className="flex items-center gap-2 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm" aria-label="Go to homepage">
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M100,150 C80,120 60,100 40,80 C20,60 30,40 50,30 C70,20 90,30 110,40 C130,50 150,70 170,90 C190,110 180,130 160,140 Z" fill="none" stroke="black" stroke-width="2" />
            <path d="M110,40 L120,30 L130,20 L140,30 L150,40" fill="black" />
            <circle cx="100" cy="150" r="50" fill="none" stroke="black" stroke-width="2" />
        </svg>
        <span className="font-semibold hidden sm:inline text-foreground">LMS Platform</span>
    </Link>
);

const NavBar = ({ toggleSidebar, isSidebarOpen }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const userMenuRef = useClickOutside(() => setIsUserMenuOpen(false), isUserMenuOpen);
    const { success: showSuccessToast } = useToast();
    const from = "/signin";

    const { user, logout, updateUserState } = useAuthContext();

    const openModal = () => { setIsModalOpen(true); setIsUserMenuOpen(false); };
    const closeModal = () => { setIsModalOpen(false); };

    const handleLogout = () => {
        logout();
        showSuccessToast("Logout successful! Redirecting...");
        setTimeout(() => navigate(from, { replace: true }), 0);
        setIsUserMenuOpen(false);
    };

    const username = user?.name ?? "User";
    const profileImageUrl = user?.profile_image_original_url || PlaceholderAvatar;

    return (
        <>
            <nav className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-card text-card-foreground sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden" aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}>
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </Button>
                    <LogoIcon />
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </Button>
                    {user && (
                        <div className="relative" ref={userMenuRef}>
                            <button
                                className="flex items-center gap-2 p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card hover:bg-accent transition-colors"
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} aria-haspopup="true" aria-expanded={isUserMenuOpen} aria-controls="user-menu"
                            >
                                <img
                                    src={profileImageUrl}
                                    alt={`${username}'s avatar`}
                                    className="w-8 h-8 rounded-full object-cover bg-muted border border-border"
                                    onError={(e) => { e.target.onerror = null; e.target.src = PlaceholderAvatar; }}
                                />
                                <span className="font-medium text-sm hidden md:inline mr-1">{username}</span>
                                <ChevronDown size={16} className={`hidden md:inline transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isUserMenuOpen && (
                                <div id="user-menu" className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-border focus:outline-none py-1 z-50" role="menu" aria-orientation="vertical">
                                    <button onClick={openModal} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent" role="menuitem">
                                        <Settings size={16} /> Update Profile
                                    </button>
                                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10" role="menuitem">
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>
            {isModalOpen && user && (
                <UpdateDetailsModal
                    closeModalFunc={closeModal}
                    currentUser={{ user_id: user.user_id, name: user.name, email: user.email }}
                    onUpdateSuccess={updateUserState}
                />
            )}
        </>
    );
};

export default NavBar;