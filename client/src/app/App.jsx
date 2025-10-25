import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HealthPage from './pages/HealthPage';

const App = () => (
  <div className="min-h-screen bg-background text-foreground">
    <main className="px-lg">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthPage />} />
      </Routes>
    </main>
  </div>
);

export default App;
