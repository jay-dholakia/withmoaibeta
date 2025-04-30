
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  Tag, 
  FileText,
  ShoppingBag,
  MessageCircle 
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CoachResource } from '@/services/coach-resource-service';

interface ResourceDetailsDialogProps {
  resource: CoachResource | null;
  isOpen: boolean;
  onClose: () => void;
}

const ResourceDetailsDialog: React.FC<ResourceDetailsDialogProps> = ({ 
  resource, 
  isOpen, 
  onClose 
}) => {
  if (!resource) return null;

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Article';
      case 'product': return 'Product';
      case 'tip': return 'Coach\'s Tip';
      default: return 'Resource';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'article': 
        return <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      case 'product':
        return <ShoppingBag className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />;
      case 'tip':
        return <MessageCircle className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
      default:
        return null;
    }
  };

  const formatDescription = (text: string | null | undefined) => {
    if (!text) return null;
    
    // Convert line breaks to paragraph elements
    return text.split('\n').map((paragraph, index) => 
      paragraph.trim() ? <p key={index} className="mb-2">{paragraph}</p> : <br key={index} />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-muted dark:bg-gray-800 rounded-md">
              {getResourceTypeIcon(resource.resource_type)}
            </div>
            <span className="text-xl">{resource.title}</span>
          </DialogTitle>
          <div className="flex items-center mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              resource.resource_type === 'article' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
              resource.resource_type === 'product' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 
              'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
            }`}>
              {getResourceTypeLabel(resource.resource_type)}
            </span>
          </div>
        </DialogHeader>
        
        <div className="py-2">
          {resource.description && (
            <div className="mt-2 text-gray-700 dark:text-gray-300">
              {formatDescription(resource.description)}
            </div>
          )}

          {resource.url && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="text-blue-600 dark:text-blue-400 flex items-center gap-1"
                asChild
              >
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  {resource.resource_type === 'product' ? 'View Product' : 'Visit Resource'}
                  <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </Button>
            </div>
          )}

          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {resource.tags.map(tag => (
                  <div key={tag} className="flex items-center bg-muted dark:bg-gray-700 text-xs px-2 py-1 rounded-full dark:text-gray-300">
                    <Tag className="h-3 w-3 mr-1 text-muted-foreground dark:text-gray-400" />
                    <span>{tag === "Electrolyte Packs" ? "Electrolytes" : tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Separator className="my-2 dark:bg-gray-700" />
        
        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceDetailsDialog;
