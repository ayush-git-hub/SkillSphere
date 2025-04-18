import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import SideBar from './SideBar';
import { X } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside';

const MainAppLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        closeSidebar();
    }, [location.pathname]);

    const sidebarRef = useClickOutside(closeSidebar, isSidebarOpen);

    return (
        <div className="flex flex-col h-screen bg-background">
            <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

            <div className="flex flex-1 overflow-hidden">
                <div
                    ref={sidebarRef}
                    className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border sidebar-transition transform ${isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
                        } lg:translate-x-0 lg:static lg:inset-y-auto lg:z-auto lg:border-r lg:shadow-none`}
                >
                    <button
                        onClick={toggleSidebar}
                        className="absolute top-4 right-4 p-2 rounded-md text-muted-foreground hover:text-foreground lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                    <SideBar />
                </div>

                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                        onClick={toggleSidebar}
                        aria-hidden="true"
                    ></div>
                )}

                <main className="flex-1 overflow-y-auto focus:outline-none">
                    <div className="container py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainAppLayout;