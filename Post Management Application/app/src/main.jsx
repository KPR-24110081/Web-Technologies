import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter enables real URLs for the pages under /, /create,
        /post/:id and /archive. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
