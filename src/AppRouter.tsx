// src/AppRouter.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

const LoadingFallback: React.FC = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0a0e14',
  }}>
    <Spin size="large" />
  </div>
);

const Login = lazy(() => import('./pages/Login/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Contacts = lazy(() => import('./pages/Contacts/Contacts'));
const ContactAdd = lazy(() => import('./pages/Contacts/Add/Add'));
const ContactDetail = lazy(() => import('./pages/Contacts/Detail/Detail'));
const Blacklist = lazy(() => import('./pages/Blacklist/Blacklist'));
const Reminders = lazy(() => import('./pages/Reminders/Reminders'));

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/add" element={<ContactAdd />} />
          <Route path="/contacts/detail/:id" element={<ContactDetail />} />
          <Route path="/blacklist" element={<Blacklist />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/" element={<Navigate replace to="/login" />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;