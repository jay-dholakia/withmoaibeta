
import React from 'react';
import { Edit, X, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EditModeButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export const EditModeButtons: React.FC<EditModeButtonsProps> = ({
  onCancel,
  onSave,
  isSaving,
}) => {
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onCancel}
        disabled={isSaving}
      >
        <X className="h-4 w-4 mr-2" />
        Cancel
      </Button>
      <Button 
        variant="default" 
        size="sm" 
        onClick={onSave}
        disabled={isSaving}
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </>
  );
};

interface ViewModeButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export const ViewModeButtons: React.FC<ViewModeButtonsProps> = ({
  onEdit,
  onDelete,
  isDeleting,
}) => {
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onEdit}
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit Workout
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={isDeleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete Workout'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the custom workout and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
