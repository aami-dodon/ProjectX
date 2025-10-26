import React from 'react';
import { useRoutes } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout.jsx';
import HomePage from '../../features/home/pages/HomePage';
import { DesignSystemPage } from '../../features/design-system';

const AppRoutes = () => {
  return useRoutes([
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'design-system', element: <DesignSystemPage /> },
      ],
    },
  ]);
};

export default AppRoutes;
