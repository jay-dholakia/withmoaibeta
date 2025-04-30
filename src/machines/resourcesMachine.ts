
import { createMachine, assign } from 'xstate';
import { CoachResource } from '@/services/coach-resource-service';

// Define the context (state) for the resources machine
interface ResourcesContext {
  resources: CoachResource[];
  editingResource: CoachResource | null;
  isAddDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isSubmitting: boolean;
}

// Define events that can be sent to the machine
type ResourcesEvent =
  | { type: 'LOAD_RESOURCES'; resources: CoachResource[] }
  | { type: 'SET_EDITING_RESOURCE'; resource: CoachResource }
  | { type: 'CLEAR_EDITING_RESOURCE' }
  | { type: 'OPEN_ADD_DIALOG' }
  | { type: 'CLOSE_ADD_DIALOG' }
  | { type: 'OPEN_EDIT_DIALOG' }
  | { type: 'CLOSE_EDIT_DIALOG' }
  | { type: 'START_SUBMISSION' }
  | { type: 'COMPLETE_SUBMISSION' }
  | { type: 'SUBMISSION_ERROR' };

export const resourcesMachine = createMachine({
  id: 'resources',
  initial: 'idle',
  context: {
    resources: [],
    editingResource: null,
    isAddDialogOpen: false,
    isEditDialogOpen: false,
    isSubmitting: false
  } as ResourcesContext,
  types: {
    context: {} as ResourcesContext,
    events: {} as ResourcesEvent,
  },
  states: {
    idle: {
      on: {
        LOAD_RESOURCES: {
          actions: assign({
            resources: ({ event }) => event.resources
          })
        },
        SET_EDITING_RESOURCE: {
          actions: assign({
            editingResource: ({ event }) => event.resource
          })
        },
        CLEAR_EDITING_RESOURCE: {
          actions: assign({
            editingResource: (_) => null
          })
        },
        OPEN_ADD_DIALOG: {
          target: 'addingResource'
        },
        OPEN_EDIT_DIALOG: {
          target: 'editingResource'
        }
      }
    },
    addingResource: {
      entry: assign({
        isAddDialogOpen: (_) => true
      }),
      on: {
        CLOSE_ADD_DIALOG: {
          target: 'idle',
          actions: assign({
            isAddDialogOpen: (_) => false
          })
        },
        START_SUBMISSION: {
          target: 'submitting',
          actions: assign({
            isSubmitting: (_) => true
          })
        }
      }
    },
    editingResource: {
      entry: assign({
        isEditDialogOpen: (_) => true
      }),
      on: {
        CLOSE_EDIT_DIALOG: {
          target: 'idle',
          actions: [
            assign({
              isEditDialogOpen: (_) => false,
              editingResource: (_) => null
            })
          ]
        },
        START_SUBMISSION: {
          target: 'submitting',
          actions: assign({
            isSubmitting: (_) => true
          })
        }
      }
    },
    submitting: {
      on: {
        COMPLETE_SUBMISSION: {
          target: 'idle',
          actions: assign({
            isSubmitting: (_) => false,
            isAddDialogOpen: (_) => false,
            isEditDialogOpen: (_) => false,
            editingResource: (_) => null
          })
        },
        SUBMISSION_ERROR: {
          target: 'idle',
          actions: assign({
            isSubmitting: (_) => false
          })
        }
      }
    }
  }
});
