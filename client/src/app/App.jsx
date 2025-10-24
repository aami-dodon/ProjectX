import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/Home.jsx';
import HealthDashboard from '../features/health/pages/HealthDashboard.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
