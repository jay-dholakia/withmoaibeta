import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Index } from '@/pages';
import { Register } from '@/pages/auth/register';
import { ResetPassword } from '@/pages/auth/reset-password';
import { ClientLogin } from '@/pages/client/auth/login';
import { ClientDashboard } from '@/pages/client/dashboard';
import { ClientLayout } from '@/layouts/ClientLayout';
import { WorkoutsPage } from '@/pages/client/workouts';
import { LeaderboardPage } from '@/pages/client/leaderboard';
import { MoaiPage } from '@/pages/client/moai';
import { NotesPage } from '@/pages/client/notes';
import { SettingsPage } from '@/pages/client/settings';
import { ProfileBuilder } from '@/pages/client/profile-builder';
import { CoachLogin } from '@/pages/coach/auth/login';
import { CoachDashboard } from '@/pages/coach/dashboard';
import { CoachLayout } from '@/layouts/CoachLayout';
import { ClientsPage } from '@/pages/coach/clients';
import { ProgramsPage } from '@/pages/coach/programs';
import { ProgramDetail } from '@/pages/coach/programs/program-detail';
import { CreateProgram } from '@/pages/coach/programs/create-program';
import { EditProgram } from '@/pages/coach/programs/edit-program';
import { WorkoutsPage as CoachWorkoutsPage } from '@/pages/coach/workouts';
import { CreateWorkout } from '@/pages/coach/workouts/create-workout';
import { EditWorkout } from '@/pages/coach/workouts/edit-workout';
import { AdminLogin } from '@/pages/admin/auth/login';
import { AdminDashboard } from '@/pages/admin/dashboard';
import { AdminLayout } from '@/layouts/AdminLayout';
import { UsersPage } from '@/pages/admin/users';
import { ExercisesPage } from '@/pages/admin/exercises';
import { NotFound } from '@/pages/not-found';
import { CreateCustomWorkout } from '@/pages/client/workouts/create-custom-workout';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';
import CustomWorkoutActiveView from '@/components/client/CustomWorkoutActiveView';

function App() {
  return (
    
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Client Routes */}
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/client-dashboard" element={<ClientLayout />}>
          <Route index element={<ClientDashboard />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="workouts/custom/create" element={<CreateCustomWorkout />} />
          <Route path="workouts/custom/:workoutId" element={<CustomWorkoutDetail />} />
          <Route path="workouts/custom/:workoutId/active" element={<CustomWorkoutActiveView />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="moai" element={<MoaiPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/profile-builder" element={<ProfileBuilder />} />
        
        {/* Coach Routes */}
        <Route path="/coach-login" element={<CoachLogin />} />
        <Route path="/coach-dashboard" element={<CoachLayout />}>
          <Route index element={<CoachDashboard />} />
          <Route path="clients" element={<ClientsPage />} />
          
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="programs/create" element={<CreateProgram />} />
          <Route path="programs/:programId" element={<ProgramDetail />} />
          <Route path="programs/:programId/edit" element={<EditProgram />} />
          
          <Route path="workouts" element={<CoachWorkoutsPage />} />
          <Route path="workouts/create" element={<CreateWorkout />} />
          <Route path="workouts/:workoutId/edit" element={<EditWorkout />} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="exercises" element={<ExercisesPage />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    
  );
}

export default App;
