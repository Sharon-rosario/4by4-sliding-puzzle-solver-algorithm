import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

const container = document.getElementById('root') || document.body.appendChild(document.createElement('div'));
if (!container.id) container.id = 'root';

const root = createRoot(container);
root.render(
    <React.StrictMode>
    <App />
    </React.StrictMode>
);
