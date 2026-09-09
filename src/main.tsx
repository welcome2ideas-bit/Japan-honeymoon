/// <reference types="vite/client" />
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import { useNow } from './hooks';
import { todayPlan } from './lib/today';
import { useTrip } from './context';
import { TripProvider } from './context';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import './styles.css';
import { ErrorBoundary } from './components/ErrorBoundary';
const Now=lazy(()=>import('./pages/Now'));
const Itinerary=lazy(()=>import('./pages/Itinerary'));
const Hotels=lazy(()=>import('./pages/Travel').then(m=>({default:m.Hotels})));
const Transport=lazy(()=>import('./pages/Travel').then(m=>({default:m.Transport})));
const Checklist=lazy(()=>import('./pages/Checklist'));
const Wishlist=lazy(()=>import('./pages/Wishlist'));
const Places=lazy(()=>import('./pages/Places'));
const PlacePage=lazy(()=>import('./pages/Places').then(m=>({default:m.PlacePage})));
const Settings=lazy(()=>import('./pages/Settings'));
function Landing(){const location=useLocation();const {itinerary,places}=useTrip();const now=useNow();return location.key==='default'&&todayPlan(itinerary,places,now).day?<Navigate to="/ahora" replace/>:<Home/>;}
// Reuse the root when Vite reevaluates this entry during development.
const root: ReturnType<typeof ReactDOM.createRoot> = import.meta.hot?.data.root ?? ReactDOM.createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<React.StrictMode><ErrorBoundary><TripProvider><HashRouter><Suspense fallback={<div className="loading" role="status">Preparando nuestro viaje…</div>}><Routes><Route element={<Layout/>}><Route index element={<Landing/>}/><Route path="lugares" element={<Places/>}/><Route path="lugares/:id" element={<PlacePage/>}/><Route path="ahora" element={<Now/>}/><Route path="itinerario" element={<Itinerary/>}/><Route path="transportes" element={<Transport/>}/><Route path="hoteles" element={<Hotels/>}/><Route path="pendientes" element={<Checklist/>}/><Route path="wishlist" element={<Wishlist/>}/><Route path="ajustes" element={<Settings/>}/><Route path="*" element={<div className="empty"><h1>Nos hemos desviado un poquito.</h1><Link className="button primary" to="/">Volver al inicio</Link></div>}/></Route></Routes></Suspense></HashRouter></TripProvider></ErrorBoundary></React.StrictMode>);

