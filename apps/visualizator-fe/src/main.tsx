import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
