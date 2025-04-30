
import { useState, useCallback } from 'react';

export const useResources = () => {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Implement your fetch logic here, or use this as a placeholder
      const response = await fetch('/api/resources');
      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch resources'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addResource = useCallback(async (resource) => {
    setIsLoading(true);
    setError(null);
    try {
      // Implement your add logic here, or use this as a placeholder
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resource),
      });
      const newResource = await response.json();
      setResources(prev => [...prev, newResource]);
      return newResource;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add resource'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    resources,
    isLoading,
    error,
    fetchResources,
    addResource
  };
};
