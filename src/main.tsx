/**
 * DMC:    VIZ-00-00-00-900B
 * Título: Núcleo › Ponto de entrada da aplicação
 * BREX:   VIZ-00-00-00-022A
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
