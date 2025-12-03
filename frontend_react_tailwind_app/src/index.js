import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { RouterProvider } from 'react-router-dom';
import router from './router';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Mount the Router exactly once and render the app within it */}
    <RouterProvider router={router}>
      <App />
    </RouterProvider>
  </React.StrictMode>
);
