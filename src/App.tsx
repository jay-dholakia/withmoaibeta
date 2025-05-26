
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import Index from "./pages/Index";
import ClientLogin from "./pages/ClientLogin";
import Register from "./pages/Register";
import ClientDashboard from "./pages/client/ClientDashboard";
import CoachDashboard from "./pages/coach/CoachDashboard";
import ProfileEditor from "./pages/client/ProfileEditor";
import ProfileBuilder from "./pages/client/ProfileBuilder";
import WorkoutDetailsPage from "./pages/client/WorkoutDetailsPage";
import WorkoutProgramsPage from "./pages/coach/WorkoutProgramsPage";
import CreateWorkoutProgramPage from "./pages/coach/CreateWorkoutProgramPage";
import ProgramDetailPage from "./pages/coach/ProgramDetailPage";
import CreateWorkoutWeekPage from "./pages/coach/CreateWorkoutWeekPage";
import WorkoutWeekDetailPage from "./pages/coach/WorkoutWeekDetailPage";
import EditWorkoutPage from "./pages/coach/EditWorkoutPage";
import ExerciseManagementPage from "./pages/coach/ExerciseManagementPage";
import NotFound from "./pages/NotFound";
import AssignProgramPage from "./pages/coach/AssignProgramPage";
import ProgramAssignmentPage from "./pages/coach/ProgramAssignmentPage";
import StandaloneWorkoutsPage from "./pages/coach/StandaloneWorkoutsPage";
import ClientsPage from "./pages/coach/ClientsPage";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<ClientLogin />} />
              <Route path="/signup" element={<Register />} />

              {/* Client Routes */}
              <Route
                path="/client-dashboard"
                element={
                  <RequireAuth allowedUserTypes={['client']}>
                    <ClientDashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/client-dashboard/profile-editor"
                element={
                  <RequireAuth allowedUserTypes={['client']}>
                    <ProfileEditor />
                  </RequireAuth>
                }
              />
              <Route
                path="/client-profile-builder"
                element={
                  <RequireAuth allowedUserTypes={['client']}>
                    <ProfileBuilder />
                  </RequireAuth>
                }
              />
              <Route
                path="/client-dashboard/workouts/:workoutId"
                element={
                  <RequireAuth allowedUserTypes={['client']}>
                    <WorkoutDetailsPage />
                  </RequireAuth>
                }
              />

              {/* Coach Routes */}
              <Route
                path="/coach-dashboard"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <CoachDashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/workouts"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <WorkoutProgramsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/workouts/create"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <CreateWorkoutProgramPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/workouts/:id"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <ProgramDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/workouts/:id/assign"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <AssignProgramPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/workouts/:programId/create-week"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <CreateWorkoutWeekPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/workout-weeks/:id"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <WorkoutWeekDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/workouts/:id/edit"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <EditWorkoutPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/exercise-templates"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <ExerciseManagementPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/program-assignment"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <ProgramAssignmentPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/standalone-workouts"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <StandaloneWorkoutsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/clients"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <ClientsPage />
                  </RequireAuth>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
