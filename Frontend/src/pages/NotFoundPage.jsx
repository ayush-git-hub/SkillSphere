import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-10rem)] px-4">
            <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">404 - Page Not Found</h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-md">
                Oops! The page you are looking for doesn't exist or has been moved.
            </p>
            <Button
                as={Link}
                to="/explore"
                variant="primary"
                size="lg"
            >
                Go to Explore Page
            </Button>
        </div>
    );
};

export default NotFoundPage;