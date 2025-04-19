import React, { useState, useEffect } from 'react';
import SideIllustration_dark from '../../assets/images/SideIllustration-dark.png';
import SideIllustration_light from '../../assets/images/SideIllustration-light.png';

const AuthIllustration = () => {
    const [theme, setTheme] = useState('light');
    const [imageSrc, setImageSrc] = useState(SideIllustration_light);

    useEffect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
        setTheme(savedTheme);

        if (!localStorage.getItem('theme')) {
            localStorage.setItem('theme', 'light');
        }
    }, []);

    useEffect(() => {
        const img = theme === 'dark' ? SideIllustration_dark : SideIllustration_light;
        setImageSrc(img);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [theme]);

    return (
        <div className="flex items-center justify-center h-full w-full">
            <img
                src={imageSrc}
                alt="Auth Illustration"
                className="w-1/2 h-auto animate-float"
                onError={() => setImageSrc(SideIllustration_light)}
            />
        </div>
    );
};

export default AuthIllustration;
