import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, onChange, size = 'md', readOnly = false, className = "" }) => {
    const stars = [1, 2, 3, 4, 5];
    const starSizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-7 w-7',
    };
    const currentSize = starSizeClasses[size] || starSizeClasses.md;

    return (
        <div className={`flex gap-0.5 ${readOnly ? 'cursor-default' : ''} ${className}`}> {/* Reduced gap */}
            {stars.map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={!readOnly ? () => onChange(star) : undefined}
                    className={`transition-colors duration-150 ease-in-out focus:outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-ring
                        ${star <= rating ? "text-yellow-400 dark:text-yellow-500" : "text-muted-foreground/40"}
                        ${!readOnly ? "hover:text-yellow-300 dark:hover:text-yellow-400 cursor-pointer" : ""}
                    `}
                    aria-label={readOnly ? `${rating} out of 5 stars` : `Rate ${star} out of 5 stars`}
                    disabled={readOnly}
                    aria-pressed={!readOnly && star === rating}
                >
                    <Star className={`${currentSize} fill-current`} />
                </button>
            ))}
        </div>
    );
};


export const StarRatingDisplay = ({ rating, size = 'md', className = "" }) => {
    return <StarRating rating={rating} onChange={() => { }} size={size} readOnly={true} className={className} />;
}


export default StarRating; 