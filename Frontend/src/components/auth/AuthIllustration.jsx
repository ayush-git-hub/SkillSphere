import React from 'react';

// Replace with your actual SVG content or import from a file
const AuthIllustration = (props) => (
    <svg {...props} viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
        {/* Simple abstract shapes for placeholder */}
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--muted))', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary))', stopOpacity: 0.6 }} />
            </linearGradient>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.1 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(var(--ring))', stopOpacity: 0.3 }} />
            </linearGradient>
        </defs>
        <rect x="10" y="10" width="180" height="80" rx="10" ry="10" fill="url(#grad1)" />
        <circle cx="50" cy="50" r="30" fill="url(#grad2)" />
        <path d="M 120,20 Q 150,50 120,80" stroke="hsl(var(--border))" strokeWidth="3" fill="none" />
        <rect x="140" y="35" width="40" height="30" rx="5" ry="5" fill="hsl(var(--accent))" opacity="0.7" />
        <text x="100" y="60" fontFamily="Arial, sans-serif" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">LMS</text>
    </svg>
);

export default AuthIllustration;