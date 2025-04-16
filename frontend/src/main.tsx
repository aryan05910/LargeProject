import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './Login';
import App from './App';
import SignUp from './SignUp'; // optional

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />         {/* default = login page */}
        <Route path="/main" element={<App />} />       {/* your original app */}
        <Route path="/signup" element={<SignUp />} />  {/* optional register */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
