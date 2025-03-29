
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Index from "./pages/Index";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientLogin from "./pages/ClientLogin";
import CoachLogin from "./pages/CoachLogin";
import AdminLogin from "./pages/AdminLogin";
import RequireAuth from "./components/RequireAuth";
import { AdminDashboardLayout } from "./layouts/AdminDashboardLayout";
import ClientsPage from "./pages/admin/ClientsPage";
import CoachesPage from "./pages/admin/CoachesPage";

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Define the routes for the application
const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    errorElement: <NotFound />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/client-login",
    element: <ClientLogin />,
  },
  {
    path: "/coach-login",
    element: <CoachLogin />,
  },
  {
    path: "/admin-login",
    element: <AdminLogin />,
  },
  {
    path: "/admin-dashboard",
    element: (
      <RequireAuth userType="admin">
        <AdminDashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/admin",
    element: (
      <RequireAuth userType="admin">
        <AdminDashboardLayout title="Admin Dashboard">
          <div>Admin Dashboard Content</div>
        </AdminDashboardLayout>
      </RequireAuth>
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
