import React from 'react';
import { useRoutes } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import DashboardLayout from '../layout/DashboardLayout.jsx';
import HomePage from '../pages/HomePage';
import HealthPage from '../pages/HealthPage';
import ThemePage from '../pages/ThemePage';
import DashboardPage from '../pages/DashboardPage.jsx';

const AppRoutes = () => {
  return useRoutes([
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'health', element: <HealthPage /> },
        { path: 'theme', element: <ThemePage /> },
        {
          path: 'dashboard',
          element: <DashboardLayout />,
          children: [{ index: true, element: <DashboardPage /> }],
        },
      ],
    },
  ]);
};

export default AppRoutes;
