// updated
import { useState, useCallback } from 'react';
// Removed: import { useToast } from './useToast';

function useApi(apiFunction) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Removed: const { error: showErrorToast } = useToast();

    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        setData(null);
        try {
            const result = await apiFunction(...args);
            setData(result);
            return result;
        } catch (err) {
            console.error("API Hook Error:", err);
            // Set the error state, but don't show the toast here
            setError(err.message || 'An unknown error occurred.');
            // Let the component decide to show the toast based on the error state
        } finally {
            setLoading(false);
        }
        // Removed showErrorToast from dependency array
    }, [apiFunction]);

    return { data, loading, error, execute };
}

export default useApi;