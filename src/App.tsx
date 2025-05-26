import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ClientDashboard from "./pages/client/ClientDashboard";
import CoachDashboard from "./pages/coach/CoachDashboard";
import ProfileEditor from "./pages/client/ProfileEditor";
import ClientProfileBuilder from "./pages/client/ClientProfileBuilder";
import WorkoutDetailPage from "./pages/client/WorkoutDetailPage";
import WorkoutProgramsPage from "./pages/coach/WorkoutProgramsPage";
import CreateWorkoutProgramPage from "./pages/coach/CreateWorkoutProgramPage";
import EditWorkoutProgramPage from "./pages/coach/EditWorkoutProgramPage";
import ProgramDetailPage from "./pages/coach/ProgramDetailPage";
import CreateWorkoutWeekPage from "./pages/coach/CreateWorkoutWeekPage";
import WorkoutWeekDetailPage from "./pages/coach/WorkoutWeekDetailPage";
import CreateWorkoutPage from "./pages/coach/CreateWorkoutPage";
import EditWorkoutPage from "./pages/coach/EditWorkoutPage";
import ExerciseTemplatesPage from "./pages/coach/ExerciseTemplatesPage";
import CreateExerciseTemplatePage from "./pages/coach/CreateExerciseTemplatePage";
import EditExerciseTemplatePage from "./pages/coach/EditExerciseTemplatePage";
import NotFound from "./pages/NotFound";
import AssignProgramPage from "./pages/coach/AssignProgramPage";
import ProgramAssignmentPage from "./pages/coach/ProgramAssignmentPage";
import ActiveWorkoutPage from "./pages/client/ActiveWorkoutPage";
import EditProfile from "./pages/client/EditProfile";
import Settings from "./pages/client/Settings";
import WorkoutHistory from "./pages/client/WorkoutHistory";
import WorkoutHistoryDetail from "./pages/client/WorkoutHistoryDetail";
import StandaloneWorkoutPage from "./pages/coach/StandaloneWorkoutPage";
import EditStandaloneWorkoutPage from "./pages/coach/EditStandaloneWorkoutPage";
import CreateStandaloneWorkoutPage from "./pages/coach/CreateStandaloneWorkoutPage";
import ClientManagementPage from "./pages/coach/ClientManagementPage";
import ClientDetailPage from "./pages/coach/ClientDetailPage";

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
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Client Routes */}
              <Route
                path="/client-dashboard"
                element={
                  <ProtectedRoute allowedUserTypes={['client']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-dashboard/profile-editor"
                element={
                  <ProtectedRoute allowedUserTypes={['client']}>
                    <ProfileEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-profile-builder"
                element={
                  <ProtectedRoute allowedUserTypes={['client']}>
                    <ClientProfileBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-dashboard/workouts/:workoutId"
                element={
                  <ProtectedRoute allowedUserTypes={['client']}>
                    <WorkoutDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-dashboard/workouts/active/:workoutId"
                element={
                  <ProtectedRoute allowedUserTypes={['client']}>
                    <ActiveWorkoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-dashboard/settings/edit-profile"
                element={
                  <ProtectedRoute allowedUserTypes={['client']}>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-dashboard/settings"
                element={
                  <ProtectedRoute allowedUserTypes={['client']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-dashboard/workout-history"
                element={
                  <ProtectedRoute allowedUserTypes={['client']}>
                    <WorkoutHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-dashboard/workout-history/:completionId"
                element={
                  <ProtectedRoute allowedUserTypes={['client']}>
                    <WorkoutHistoryDetail />
                  </ProtectedRoute>
                }
              />

              {/* Coach Routes */}
              <Route
                path="/coach-dashboard"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <CoachDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/workouts"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <WorkoutProgramsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/workouts/create"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <CreateWorkoutProgramPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/workouts/:id/edit"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <EditWorkoutProgramPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/workouts/:id"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <ProgramDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/workouts/:programId/create-week"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <CreateWorkoutWeekPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workout-weeks/:id"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <WorkoutWeekDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workout-weeks/:weekId/create-workout"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <CreateWorkoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workouts/:id/edit"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <EditWorkoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/exercise-templates"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <ExerciseTemplatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/exercise-templates/create"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <CreateExerciseTemplatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/exercise-templates/:id/edit"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <EditExerciseTemplatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/workouts/:programId/assign"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <AssignProgramPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/program-assignment"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <ProgramAssignmentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/standalone-workouts"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <StandaloneWorkoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/standalone-workouts/create"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <CreateStandaloneWorkoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/standalone-workouts/:id/edit"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <EditStandaloneWorkoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/clients"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <ClientManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach-dashboard/clients/:clientId"
                element={
                  <ProtectedRoute allowedUserTypes={['coach']}>
                    <ClientDetailPage />
                  </ProtectedRoute>
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
