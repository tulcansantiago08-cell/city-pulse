/**
 * Punto de entrada del frontend: monta React en <div id="root"> (index.html),
 * activa el enrutador y la sesión.
 *
 * @author Santiago Rivas
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SesionProvider } from './context/SesionContext';
import App from './App';
import './estilos.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <App />
      </SesionProvider>
    </BrowserRouter>
  </React.StrictMode>
);
