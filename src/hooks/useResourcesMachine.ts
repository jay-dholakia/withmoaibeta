
import { useInterpret, useSelector } from '@xstate/react';
import { resourcesMachine } from '@/machines/resourcesMachine';
import { CoachResource } from '@/services/coach-resource-service';

export const useResourcesMachine = () => {
  const resourcesActor = useInterpret(resourcesMachine);
  
  return {
    // State
    resources: useSelector(resourcesActor, state => state.context.resources),
    editingResource: useSelector(resourcesActor, state => state.context.editingResource),
    isAddDialogOpen: useSelector(resourcesActor, state => state.context.isAddDialogOpen),
    isEditDialogOpen: useSelector(resourcesActor, state => state.context.isEditDialogOpen),
    isSubmitting: useSelector(resourcesActor, state => state.context.isSubmitting),
    currentState: useSelector(resourcesActor, state => state.value),
    
    // Actions
    loadResources: (resources: CoachResource[]) => 
      resourcesActor.send({ type: 'LOAD_RESOURCES', resources }),
    setEditingResource: (resource: CoachResource) => 
      resourcesActor.send({ type: 'SET_EDITING_RESOURCE', resource }),
    clearEditingResource: () => 
      resourcesActor.send({ type: 'CLEAR_EDITING_RESOURCE' }),
    openAddDialog: () => 
      resourcesActor.send({ type: 'OPEN_ADD_DIALOG' }),
    closeAddDialog: () => 
      resourcesActor.send({ type: 'CLOSE_ADD_DIALOG' }),
    openEditDialog: () => 
      resourcesActor.send({ type: 'OPEN_EDIT_DIALOG' }),
    closeEditDialog: () => 
      resourcesActor.send({ type: 'CLOSE_EDIT_DIALOG' }),
    startSubmission: () => 
      resourcesActor.send({ type: 'START_SUBMISSION' }),
    completeSubmission: () => 
      resourcesActor.send({ type: 'COMPLETE_SUBMISSION' }),
    submissionError: () => 
      resourcesActor.send({ type: 'SUBMISSION_ERROR' })
  };
};
