import React from 'react';
import { useRoutes } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout.jsx';
import HomePage from '../pages/HomePage';

const AppRoutes = () => {
  return useRoutes([
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <HomePage /> },
      ],
    },
  ]);
};

export default AppRoutes;
