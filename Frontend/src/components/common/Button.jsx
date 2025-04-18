import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Button = React.forwardRef(({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    children,
    icon: Icon,
    iconPosition = 'left',
    ...props
}, ref) => {

    const baseClasses = 'btn';
    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        destructive: 'btn-destructive',
        outline: 'btn-outline',
        ghost: 'btn-ghost',
        link: 'btn-link',
    };
    const sizeClasses = {
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg',
        icon: 'btn-icon',
    };

    const combinedClassName = `
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isLoading ? 'cursor-wait' : ''}
        ${className}
    `.trim().replace(/\s+/g, ' ');


    return (
        <button
            ref={ref}
            className={combinedClassName}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <LoadingSpinner
                    size={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}
                    color={variant === 'primary' || variant === 'destructive' || variant === 'secondary' ? 'text-inherit' : 'text-primary'} // Adjust spinner color based on button text color
                />
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon className={`mr-2 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon className={`ml-2 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} />}
                </>
            )}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;