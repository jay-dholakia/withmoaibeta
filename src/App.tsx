import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Index from "./pages/Index";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ClientProfileBuilder from "./pages/ClientProfileBuilder";
import CoachDashboard from "./pages/CoachDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDashboardLayout from "./layouts/AdminDashboardLayout";
import ClientsPage from "./pages/admin/ClientsPage";
import CoachesPage from "./pages/admin/CoachesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/Login";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import ClientDashboard from "./pages/ClientDashboard";
import CoachProfileBuilder from "./pages/CoachProfileBuilder";
import ClientProfilePage from "./pages/ClientProfilePage";
import CoachProfilePage from "./pages/CoachProfilePage";
import PublicCoachProfilePage from "./pages/PublicCoachProfilePage";
import PublicClientProfilePage from "./pages/PublicClientProfilePage";
import SessionDetailsPage from "./pages/SessionDetailsPage";
import NewSessionPage from "./pages/NewSessionPage";
import EditSessionPage from "./pages/EditSessionPage";
import SessionsPage from "./pages/SessionsPage";
import ClientSessionsPage from "./pages/ClientSessionsPage";
import ClientSessionDetailsPage from "./pages/ClientSessionDetailsPage";
import EditClientSessionPage from "./pages/EditClientSessionPage";
import NewClientSessionPage from "./pages/NewClientSessionPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    errorElement: <NotFound />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/client-profile-builder",
    element: (
      <ProtectedRoute allowedUserTypes={["client"]}>
        <ClientProfileBuilder />
      </ProtectedRoute>
    ),
  },
  {
    path: "/client-dashboard",
    element: (
      <ProtectedRoute allowedUserTypes={["client"]}>
        <ClientDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/client-profile",
    element: (
      <ProtectedRoute allowedUserTypes={["client"]}>
        <ClientProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/public/client/:id",
    element: <PublicClientProfilePage />,
  },
  {
    path: "/coach-profile-builder",
    element: (
      <ProtectedRoute allowedUserTypes={["coach"]}>
        <CoachProfileBuilder />
      </ProtectedRoute>
    ),
  },
  {
    path: "/coach-dashboard",
    element: (
      <ProtectedRoute allowedUserTypes={["coach"]}>
        <CoachDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/coach-profile",
    element: (
      <ProtectedRoute allowedUserTypes={["coach"]}>
        <CoachProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/public/coach/:id",
    element: <PublicCoachProfilePage />,
  },
  {
    path: "/sessions/:id",
    element: (
      <ProtectedRoute allowedUserTypes={["coach"]}>
        <SessionDetailsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sessions/new",
    element: (
      <ProtectedRoute allowedUserTypes={["coach"]}>
        <NewSessionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sessions/:id/edit",
    element: (
      <ProtectedRoute allowedUserTypes={["coach"]}>
        <EditSessionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sessions",
    element: (
      <ProtectedRoute allowedUserTypes={["coach"]}>
        <SessionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/client-sessions",
    element: (
      <ProtectedRoute allowedUserTypes={["client"]}>
        <ClientSessionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/client-sessions/:id",
    element: (
      <ProtectedRoute allowedUserTypes={["client"]}>
        <ClientSessionDetailsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/client-sessions/:id/edit",
    element: (
      <ProtectedRoute allowedUserTypes={["client"]}>
        <EditClientSessionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/client-sessions/new",
    element: (
      <ProtectedRoute allowedUserTypes={["client"]}>
        <NewClientSessionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin-dashboard",
    element: (
      <ProtectedRoute allowedUserTypes={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedUserTypes={["admin"]}>
        <AdminDashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "clients",
        element: <ClientsPage />,
      },
      {
        path: "coaches",
        element: <CoachesPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
