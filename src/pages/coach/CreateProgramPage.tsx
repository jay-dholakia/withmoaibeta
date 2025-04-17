
// Since this seems to be a duplicate of CreateWorkoutProgramPage.tsx,
// we should avoid using it and possibly add a redirect for compatibility.

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateProgramPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the correct create page
    navigate('/coach-dashboard/workouts/create');
  }, [navigate]);

  return null;
};

export default CreateProgramPage;
