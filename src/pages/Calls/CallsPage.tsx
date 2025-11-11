/**
 * Calls page component
 * Parent page for calls - redirects to inbound by default
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

export const CallsPage: React.FC = () => {
  // Redirect to inbound calls by default
  return <Navigate to="/calls/inbound" replace />;
};

