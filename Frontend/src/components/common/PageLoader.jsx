import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const PageLoader = ({ message = "Loading..." }) => {
    return (
        <div className="fixed inset-0 z-[99] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"> {/* High z-index */}
            <LoadingSpinner size="h-12 w-12" />
            {message && <p className="mt-4 text-lg text-foreground">{message}</p>}
        </div>
    );
};

export default PageLoader;