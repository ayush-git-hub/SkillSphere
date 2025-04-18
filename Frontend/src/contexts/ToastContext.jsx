import React, { createContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircle, XCircle, X } from 'lucide-react'; // Import icons

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, message, duration = 5000) => {
        const id = uuidv4();
        const newToast = { id, type, message, duration };
        setToasts((prevToasts) => [...prevToasts, newToast]);
    }, []);

    const removeToast = useCallback((id) => {
        // Trigger exit animation first
        setToasts(currentToasts =>
            currentToasts.map(toast =>
                toast.id === id ? { ...toast, isExiting: true } : toast
            )
        );
        // Remove from state after animation duration
        setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter((toast) => toast.id !== id));
        }, 300); // Match animation duration
    }, []);

    const success = useCallback((message, duration) => {
        addToast('success', message, duration);
    }, [addToast]);

    const error = useCallback((message, duration) => {
        addToast('error', message, duration);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ success, error }}> {/* Only expose add functions */}
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

// --- ToastContainer Component ---
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm space-y-3"> {/* Increased z-index */}
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} removeToast={removeToast} />
            ))}
        </div>
    );
};

// --- Toast Component ---
const Toast = ({ id, type, message, duration, removeToast, isExiting }) => {

    useEffect(() => {
        // Don't start timer if already exiting
        if (isExiting) return;

        const timer = setTimeout(() => {
            removeToast(id); // This will trigger the exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, removeToast, isExiting]); // Depend on isExiting

    const handleClose = () => {
        removeToast(id); // Trigger exit animation on manual close
    };

    const Icon = type === 'success' ? CheckCircle : XCircle;
    const baseClasses = "relative w-full p-4 rounded-md shadow-lg flex items-start gap-3 overflow-hidden"; // Added relative and overflow
    const typeClasses = type === 'success'
        ? "bg-green-100 dark:bg-green-900/80 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-100"
        : "bg-red-100 dark:bg-red-900/80 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-100";
    const animationClass = isExiting ? "animate-toast-out" : "animate-toast-in";

    return (
        <div
            role="alert"
            aria-live={type === 'error' ? 'assertive' : 'polite'} // Assertive for errors
            className={`${baseClasses} ${typeClasses} ${animationClass}`}
        >
            <div className="flex-shrink-0 mt-0.5">
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-sm font-medium">{message}</div>
            <button
                onClick={handleClose}
                aria-label="Close notification"
                className="absolute top-2 right-2 rounded-md p-1 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};

export default ToastContext;