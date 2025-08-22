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
      // Use the execute endpoint instead of run, with saveJobs set to true
      const response = await fetch(`/api/admin/queries/${queryId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saveJobs: true, // Automatically save all fetched jobs
          selectedJobIds: [], // Empty array means save all
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run query');
      }
      
      const result = await response.json();
      
      // Create a detailed message based on the results
      let message = `Query executed successfully!\n`;
      message += `• Jobs fetched: ${result.jobsFetched}\n`;
      message += `• Jobs created: ${result.jobsCreated}\n`;
      if (result.jobsReactivated > 0) {
        message += `• Jobs reactivated: ${result.jobsReactivated}\n`;
      }
      message += `• Duplicates skipped: ${result.duplicatesSkipped}`;
      
      alert(message);
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error running query:', error);
      alert(`Failed to run query: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <button
      onClick={handleRun}
      disabled={isRunning}
      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isRunning ? 'Running...' : 'Run & Save'}
    </button>
  );
}