
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
import EditWorkoutProgramPage from "./pages/coach/EditWorkoutProgramPage";
import ProgramDetailPage from "./pages/coach/ProgramDetailPage";
import CreateWorkoutWeekPage from "./pages/coach/CreateWorkoutWeekPage";
import WorkoutWeekDetailPage from "./pages/coach/WorkoutWeekDetailPage";
import CreateWorkoutPage from "./pages/coach/CreateWorkoutPage";
import EditWorkoutPage from "./pages/coach/EditWorkoutPage";
import ExerciseManagementPage from "./pages/coach/ExerciseManagementPage";
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
import StandaloneWorkoutsPage from "./pages/coach/StandaloneWorkoutsPage";
import EditStandaloneWorkoutPage from "./pages/coach/EditStandaloneWorkoutPage";
import CreateStandaloneWorkoutPage from "./pages/coach/CreateStandaloneWorkoutPage";
import ClientsPage from "./pages/coach/ClientsPage";
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
              <Route
                path="/client-dashboard/workouts/active/:workoutId"
                element={
                  <RequireAuth allowedUserTypes={['client']}>
                    <ActiveWorkoutPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/client-dashboard/settings/edit-profile"
                element={
                  <RequireAuth allowedUserTypes={['client']}>
                    <EditProfile />
                  </RequireAuth>
                }
              />
              <Route
                path="/client-dashboard/settings"
                element={
                  <RequireAuth allowedUserTypes={['client']}>
                    <Settings />
                  </RequireAuth>
                }
              />
              <Route
                path="/client-dashboard/workout-history"
                element={
                  <RequireAuth allowedUserTypes={['client']}>
                    <WorkoutHistory />
                  </RequireAuth>
                }
              />
              <Route
                path="/client-dashboard/workout-history/:completionId"
                element={
                  <RequireAuth allowedUserTypes={['client']}>
                    <WorkoutHistoryDetail />
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
                path="/coach-dashboard/workouts/:id/edit"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <EditWorkoutProgramPage />
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
                path="/workout-weeks/:weekId/create-workout"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <CreateWorkoutPage />
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
                path="/coach-dashboard/exercise-templates/create"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <CreateExerciseTemplatePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/exercise-templates/:id/edit"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <EditExerciseTemplatePage />
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
                path="/coach-dashboard/standalone-workouts/create"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <CreateStandaloneWorkoutPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/coach-dashboard/standalone-workouts/:id/edit"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <EditStandaloneWorkoutPage />
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
              <Route
                path="/coach-dashboard/clients/:clientId"
                element={
                  <RequireAuth allowedUserTypes={['coach']}>
                    <ClientDetailPage />
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
