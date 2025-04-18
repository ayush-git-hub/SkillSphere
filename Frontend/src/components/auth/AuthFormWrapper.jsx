import React from 'react';
import AuthIllustration from './AuthIllustration';

const AuthFormWrapper = ({ children }) => {
    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
            <div className="w-full md:w-1/2 lg:w-2/5 xl:w-1/3 h-screen flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 order-2 md:order-1">
                <div className="w-full max-w-sm">
                    {children}
                </div>
            </div>

            <div className="hidden md:flex w-full md:w-1/2 lg:w-3/5 xl:w-2/3 h-64 md:h-screen justify-center items-center bg-gradient-to-br from-muted/30 to-background p-8 order-1 md:order-2">
                <AuthIllustration className="w-full max-w-xl h-auto text-primary opacity-80" />
            </div>
        </div>
    );
};

export default AuthFormWrapper;
