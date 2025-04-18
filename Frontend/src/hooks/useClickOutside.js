import { useEffect, useRef } from 'react';

function useClickOutside(handler, listenCapturing = true) {
    const ref = useRef();

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                handler();
            }
        }

        // Use capturing phase to detect clicks even if propagation is stopped inside
        document.addEventListener('click', handleClick, listenCapturing);

        return () => document.removeEventListener('click', handleClick, listenCapturing);
    }, [handler, listenCapturing]);

    return ref; // Return the ref to attach to the element
}

export default useClickOutside;