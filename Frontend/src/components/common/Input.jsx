import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({
    type = 'text',
    className = '',
    label,
    error,
    icon: Icon,
    iconPosition = 'left',
    containerClassName = '',
    wrapperClassName = '',
    showPasswordToggle = false,
    disabled = false,
    ...props
}, ref) => {

    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const currentType = isPassword && showPassword ? 'text' : type;

    const hasLeftIcon = Icon && iconPosition === 'left';
    const hasRightIcon = (Icon && iconPosition === 'right') || (isPassword && showPasswordToggle);

    const iconSizeClass = "h-4 w-4";

    const baseWrapperClasses = `
        flex items-center w-full
        border border-input
        bg-background
        rounded-md
        text-sm
        ring-0
        transition-colors duration-200
        px-3
        ${disabled ? 'cursor-not-allowed opacity-70' : ''}
    `;

    const focusWithinClasses = `
        focus-within:ring-ring
        focus-within:ring-offset-2
    `;

    const errorWrapperClasses = error
        ? 'border-destructive ring-destructive focus-within:ring-destructive'
        : 'border-input';

    const combinedWrapperClassName = `
        ${baseWrapperClasses}
        ${!disabled ? focusWithinClasses : ''}
        ${errorWrapperClasses}
        ${wrapperClassName}
    `.trim().replace(/\s+/g, ' ');

    const baseInputClasses = `
        flex-1 w-full
        bg-transparent
        py-2
        placeholder:text-muted-foreground
        disabled:cursor-not-allowed
        border-none
        outline-none
        ring-0
        focus:outline-none
        focus:ring-0
        focus:border-none
    `;

    const combinedInputClassName = `
        ${baseInputClasses}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    const togglePasswordVisibility = () => {
        if (isPassword) {
            setShowPassword(prev => !prev);
        }
    };

    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={props.id || props.name}
                    className="block text-sm font-medium text-foreground mb-1"
                >
                    {label}
                </label>
            )}

            <div className={combinedWrapperClassName}>
                {hasLeftIcon && (
                    <span className={`text-muted-foreground mr-2 flex-shrink-0 ${disabled ? 'opacity-50' : ''}`}>
                        <Icon className={iconSizeClass} aria-hidden="true" />
                    </span>
                )}

                <input
                    ref={ref}
                    type={currentType}
                    className={combinedInputClassName}
                    disabled={disabled}
                    {...props}
                />

                {hasRightIcon && (
                    <div className={`ml-2 flex-shrink-0 ${disabled ? 'opacity-50' : ''}`}>
                        {isPassword && showPasswordToggle ? (
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className={`text-muted-foreground focus:outline-none ${!disabled ? 'hover:text-foreground' : 'cursor-not-allowed'}`}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={disabled}
                            >
                                {showPassword ? <EyeOff className={iconSizeClass} /> : <Eye className={iconSizeClass} />}
                            </button>
                        ) : (
                            Icon && iconPosition === 'right' && (
                                <span className="text-muted-foreground">
                                    <Icon className={iconSizeClass} aria-hidden="true" />
                                </span>
                            )
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-xs text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;