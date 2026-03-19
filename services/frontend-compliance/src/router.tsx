import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ComplianceDashboardPage } from './pages/ComplianceDashboardPage';
import { ValidationCenterPage } from './pages/ValidationCenterPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogPage } from './pages/AuditLogPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',   element: <ComplianceDashboardPage /> },
      { path: 'validations', element: <ValidationCenterPage /> },
      { path: 'alerts',      element: <AlertsPage /> },
      { path: 'analysis',    element: <AnalysisPage /> },
      { path: 'reports',     element: <ReportsPage /> },
      { path: 'audit',       element: <AuditLogPage /> },
    ],
  },
]);

export function AppRouter() { return <RouterProvider router={router} />; }
