import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { RouterProvider } from 'react-router-dom';
import router from './router';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Provide Router at the top level so all Links/NavLinks have context */}
    <RouterProvider router={router} />
    {/* App contains global providers (Apollo/Auth) and shared UI, now rendered via router layout */}
    <App />
  </React.StrictMode>
);
