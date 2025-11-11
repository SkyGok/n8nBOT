/**
 * Welcome Header component
 * Displays welcome message and user info
 */

import React from 'react';

export const WelcomeHeader: React.FC = () => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
        Welcome back, Admin
      </h1>
      <p className="text-gray-600 text-sm sm:text-base">
        Here's what's happening with your phone analytics today
      </p>
    </div>
  );
};

