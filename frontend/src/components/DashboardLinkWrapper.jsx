// frontend/src/components/DashboardLinkWrapper.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLink from './DashboardLink'; 

const DashboardLinkWrapper = () => {
  const location = useLocation();

  // Define routes where DashboardLink should NOT appear
  const hideDashboardLinkRoutes = ['/dashboard', '/login', '/register'];

  // Conditionally render DashboardLink
  return (
    <>
      {!hideDashboardLinkRoutes.includes(location.pathname) && <DashboardLink />}
    </>
  );
};

export default DashboardLinkWrapper;