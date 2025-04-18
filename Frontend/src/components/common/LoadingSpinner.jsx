import React from 'react';

// Simple SVG Spinner - Customize as needed
const LoadingSpinner = ({ size = 'h-8 w-8', color = 'text-primary', className = '' }) => {
    return (
        <svg
            // Inherit color by default, unless explicitly overridden
            className={`animate-spin ${size} ${color ? color : 'text-inherit'} ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true" // Hide from screen readers
            role="status" // Indicate loading status
        >
            <title>Loading...</title> {/* Provide accessible name */}
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    );
};

export default LoadingSpinner;