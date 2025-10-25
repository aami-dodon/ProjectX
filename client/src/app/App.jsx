import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HealthPage from './pages/HealthPage';
import ThemePage from '../pages/ThemePage';

const App = () => (
  <div className="min-h-screen bg-background text-foreground">
    <main className="px-lg">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/theme" element={<ThemePage />} />
      </Routes>
    </main>
  </div>
);

export default App;
