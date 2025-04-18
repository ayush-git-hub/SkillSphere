// // FRONTEND/src/components/common/Input.jsx
// import React from 'react';
// import { Eye, EyeOff } from 'lucide-react';

// const Input = React.forwardRef(({
//     type = 'text',
//     className = '',
//     label,
//     error,
//     icon: Icon,
//     iconPosition = 'left', // 'left' or 'right'
//     containerClassName = '',
//     showPasswordToggle = false,
//     wrapperClassName = '', // Added for the relative div wrapper
//     ...props
// }, ref) => {
//     const [showPassword, setShowPassword] = React.useState(false);
//     const isPassword = type === 'password';
//     const currentType = isPassword && showPassword ? 'text' : type;

//     const hasLeftIcon = Icon && iconPosition === 'left';
//     // Password toggle is always considered a right icon if enabled
//     const hasRightIcon = (Icon && iconPosition === 'right') || (isPassword && showPasswordToggle);

//     // Define fixed icon size
//     const iconSizeClass = "h-4 w-4"; // Fixed size

//     // Base input classes for consistent padding and font
//     const baseInputClasses = "input flex-1 w-full text-sm"; // Ensure input fills space, consistent font

//     // Dynamic padding based on icon presence
//     const paddingClasses = `
//         ${hasLeftIcon ? 'pl-10' : 'pl-3'}
//         ${hasRightIcon ? 'pr-10' : 'pr-3'}
//         py-2 `; // Consistent vertical padding

//     const inputClassName = `
//         ${baseInputClasses}
//         ${paddingClasses}
//         ${error ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
//         ${className} /* Allow external overrides */
//     `.trim().replace(/\s+/g, ' ');

//     const togglePasswordVisibility = () => {
//         if (isPassword) {
//             setShowPassword(prev => !prev);
//         }
//     };

//     return (
//         <div className={`w-full ${containerClassName}`}>
//             {label && (
//                 <label htmlFor={props.id || props.name} className="block text-sm font-medium text-foreground mb-1">
//                     {label}
//                 </label>
//             )}
//             {/* Relative positioning wrapper for icons */}
//             <div className={`relative flex items-center w-full ${wrapperClassName}`}>
//                 {/* Left Icon */}
//                 {hasLeftIcon && (
//                     <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none z-10`}>
//                         <Icon className={iconSizeClass} />
//                     </span>
//                 )}

//                 {/* Input Field (takes flex-1 width) */}
//                 <input
//                     ref={ref}
//                     type={currentType}
//                     className={inputClassName} // Input gets the padding
//                     {...props}
//                 />

//                 {/* Right Icon (Standard) OR Password Toggle */}
//                 {hasRightIcon && (
//                     <div className="absolute inset-y-0 right-0 flex items-center pr-3 z-10">
//                         {/* Render password toggle if applicable */}
//                         {isPassword && showPasswordToggle ? (
//                             <button
//                                 type="button"
//                                 onClick={togglePasswordVisibility}
//                                 className="text-muted-foreground hover:text-foreground focus:outline-none"
//                                 aria-label={showPassword ? "Hide password" : "Show password"}
//                             >
//                                 {showPassword ? <EyeOff className={iconSizeClass} /> : <Eye className={iconSizeClass} />}
//                             </button>
//                         ) : (
//                             /* Render standard right icon if provided and not password toggle */
//                             Icon && iconPosition === 'right' && (
//                                 <span className="text-muted-foreground pointer-events-none">
//                                     <Icon className={iconSizeClass} />
//                                 </span>
//                             )
//                         )}
//                     </div>
//                 )}
//             </div>
//             {error && (
//                 <p className="mt-1 text-xs text-destructive">
//                     {error}
//                 </p>
//             )}
//         </div>
//     );
// });

// Input.displayName = 'Input';

// export default Input;
// FRONTEND/src/components/common/Input.jsx
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = React.forwardRef(({
    type = 'text',
    className = '',         // Classes for the <input> element itself
    label,
    error,
    icon: Icon,             // The icon component (e.g., Search from lucide-react)
    iconPosition = 'left',  // 'left' or 'right'
    containerClassName = '',// Classes for the outermost div (including label)
    wrapperClassName = '',  // Classes for the div that wraps the icon and input (the visual input box)
    showPasswordToggle = false,
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const currentType = isPassword && showPassword ? 'text' : type;

    const hasLeftIcon = Icon && iconPosition === 'left';
    // Password toggle is always a right icon if enabled
    const hasRightIcon = (Icon && iconPosition === 'right') || (isPassword && showPasswordToggle);

    // Define fixed icon size - consistent across all inputs
    const iconSizeClass = "h-4 w-4";

    // --- Styling for the Wrapper Div (acts as the visual input box) ---
    // Base styles for the wrapper: flex layout, alignment, padding, border, etc.
    const baseWrapperClasses = `
        flex items-center w-full
        border border-input bg-background rounded-md
        text-sm ring-offset-background
        focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 /* Focus state on wrapper */
        transition-colors duration-200 ease-in-out
        px-3 /* Horizontal padding applied to the wrapper */
    `;

    // Add error styling to the wrapper
    const errorWrapperClasses = error ? 'border-destructive ring-destructive focus-within:ring-destructive' : '';

    // Combine wrapper classes
    const combinedWrapperClassName = `
        ${baseWrapperClasses}
        ${errorWrapperClasses}
        ${wrapperClassName} /* Allow external overrides for the wrapper */
    `.trim().replace(/\s+/g, ' ');


    // --- Styling for the <input> element itself ---
    // Base styles for the input: fills space, no border/bg (wrapper has it), vertical padding
    const baseInputClasses = `
        flex-1 w-full /* Takes available space */
        bg-transparent /* Inherits background from wrapper */
        py-2 /* Consistent vertical padding */
        placeholder:text-muted-foreground
        focus:outline-none focus:ring-0 /* Remove default focus outline, handled by wrapper */
        border-none /* Remove default border, handled by wrapper */
        disabled:cursor-not-allowed disabled:opacity-50
    `;

    // Combine input classes
    const combinedInputClassName = `
        ${baseInputClasses}
        ${className} /* Allow external overrides for the input */
    `.trim().replace(/\s+/g, ' ');


    // Password toggle handler
    const togglePasswordVisibility = () => {
        if (isPassword) {
            setShowPassword(prev => !prev);
        }
    };

    return (
        <div className={`w-full ${containerClassName}`}>
            {/* Optional Label */}
            {label && (
                <label htmlFor={props.id || props.name} className="block text-sm font-medium text-foreground mb-1">
                    {label}
                </label>
            )}

            {/* Wrapper Div - This is the styled "box" and the flex container */}
            <div className={combinedWrapperClassName}>

                {/* Left Icon (if applicable) */}
                {hasLeftIcon && (
                    // Icon sits naturally in the flex flow, add margin for spacing
                    <span className="text-muted-foreground mr-2 flex-shrink-0">
                        <Icon className={iconSizeClass} aria-hidden="true" />
                    </span>
                )}

                {/* Input Element - Takes up remaining space */}
                <input
                    ref={ref}
                    type={currentType}
                    className={combinedInputClassName} // Apply input-specific styles
                    {...props}
                />

                {/* Right Icon Area (if applicable) */}
                {hasRightIcon && (
                    // Icon/Button sits naturally, add margin for spacing
                    <div className="text-muted-foreground ml-2 flex-shrink-0">
                        {/* Render password toggle button */}
                        {isPassword && showPasswordToggle ? (
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="focus:outline-none hover:text-foreground" // Add hover effect
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className={iconSizeClass} /> : <Eye className={iconSizeClass} />}
                            </button>
                        ) : (
                            /* Render standard right icon */
                            Icon && iconPosition === 'right' && (
                                <span className=""> {/* No pointer events needed as it's part of flex flow */}
                                    <Icon className={iconSizeClass} aria-hidden="true" />
                                </span>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Optional Error Message */}
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