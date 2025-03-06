'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export function MigrationButton() {
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigration = async () => {
    try {
      setIsMigrating(true);
      
      // Ask for confirmation
      if (!confirm('This will migrate your data from localStorage to the Supabase database. Continue?')) {
        setIsMigrating(false);
        return;
      }
      
      // Call the migration API endpoint
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }
      
      toast.success('Data migration completed successfully');
      
      // Reload the page to use the new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration failed. Please try again.');
    } finally {
      setIsMigrating(false);
    }
  };
  
  return (
    <button
      onClick={handleMigration}
      disabled={isMigrating}
      className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {isMigrating ? 'Migrating...' : 'Migrate to Supabase'}
    </button>
  );
} 