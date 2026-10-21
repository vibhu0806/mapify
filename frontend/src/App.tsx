import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PnrEntryPage } from './pages/PnrEntryPage.js';
import { TrackingPage } from './pages/TrackingPage.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PnrEntryPage />} />
        <Route path="/track" element={<TrackingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
