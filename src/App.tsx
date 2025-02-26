import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MainPage from './pages/mainpage';
import Recipe from './pages/recipie';

function App(): React.ReactElement {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/main" element={<Navigate to="/" replace />} />
        <Route path="/recipe" element={<Recipe />} />
        {/* Catch any other routes and redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App; 