import React from 'react';
import { useRoutes } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import HomePage from '../pages/HomePage';
import HealthPage from '../pages/HealthPage';
import ThemePage from '../pages/ThemePage';

const AppRoutes = () => {
  return useRoutes([
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'health', element: <HealthPage /> },
        { path: 'theme', element: <ThemePage /> },
      ],
    },
  ]);
};

export default AppRoutes;
