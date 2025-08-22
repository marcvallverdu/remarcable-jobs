'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RunQueryButtonProps {
  queryId: string;
}

export default function RunQueryButton({ queryId }: RunQueryButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const router = useRouter();

  const handleRun = async () => {
    setIsRunning(true);
    
    try {
      const response = await fetch(`/api/admin/queries/${queryId}/run`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to run query');
      }
      
      const result = await response.json();
      alert(`Query executed successfully! Fetched ${result.result.jobsFetched} jobs.`);
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error running query:', error);
      alert('Failed to run query. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <button
      onClick={handleRun}
      disabled={isRunning}
      className="text-sm text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isRunning ? 'Running...' : 'Run Query'}
    </button>
  );
}