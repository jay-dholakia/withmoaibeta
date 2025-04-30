
import { useMachine } from '@xstate/react';
import { resourcesMachine } from '@/machines/resourcesMachine';
import { CoachResource } from '@/services/coach-resource-service';

export const useResourcesMachine = () => {
  const [state, send] = useMachine(resourcesMachine);
  
  return {
    // State
    resources: state.context.resources,
    editingResource: state.context.editingResource,
    isAddDialogOpen: state.context.isAddDialogOpen,
    isEditDialogOpen: state.context.isEditDialogOpen,
    isSubmitting: state.context.isSubmitting,
    currentState: state.value,
    
    // Actions
    loadResources: (resources: CoachResource[]) => send({ type: 'LOAD_RESOURCES', resources }),
    setEditingResource: (resource: CoachResource) => send({ type: 'SET_EDITING_RESOURCE', resource }),
    clearEditingResource: () => send({ type: 'CLEAR_EDITING_RESOURCE' }),
    openAddDialog: () => send({ type: 'OPEN_ADD_DIALOG' }),
    closeAddDialog: () => send({ type: 'CLOSE_ADD_DIALOG' }),
    openEditDialog: () => send({ type: 'OPEN_EDIT_DIALOG' }),
    closeEditDialog: () => send({ type: 'CLOSE_EDIT_DIALOG' }),
    startSubmission: () => send({ type: 'START_SUBMISSION' }),
    completeSubmission: () => send({ type: 'COMPLETE_SUBMISSION' }),
    submissionError: () => send({ type: 'SUBMISSION_ERROR' })
  };
};
