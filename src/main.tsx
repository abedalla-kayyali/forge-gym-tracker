import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/i18n'; // Initialize i18n before rendering
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
