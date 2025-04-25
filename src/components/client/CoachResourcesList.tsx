
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Book, Calendar, Info, Link as LinkIcon, Tag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { fetchCoachResources, CoachResource } from '@/services/coach-resource-service';

interface CoachResourcesListProps {
  coachId: string;
}

const CoachResourcesList: React.FC<CoachResourcesListProps> = ({ coachId }) => {
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['coach-resources', coachId],
    queryFn: () => fetchCoachResources(coachId),
    enabled: !!coachId,
  });

  const getIconForResource = (url: string) => {
    if (url.includes('calendar') || url.includes('event') || url.includes('schedule')) {
      return <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    } else if (url.includes('book') || url.includes('pdf') || url.includes('doc')) {
      return <Book className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
    } else if (url.includes('info') || url.includes('about') || url.includes('faq')) {
      return <Info className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    } else {
      return <LinkIcon className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-4 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-client dark:text-blue-300" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-4 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground dark:text-gray-300">Unable to load coach resources</p>
        </CardContent>
      </Card>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <Card className="mt-4 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg dark:text-gray-100">Coach's Corner</CardTitle>
          <CardDescription className="dark:text-gray-300">Helpful resources from your coach</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground dark:text-gray-300">Your coach hasn't added any resources yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 shadow-lg dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg dark:text-gray-100">Coach's Corner</CardTitle>
        <CardDescription className="dark:text-gray-300">Helpful resources from your coach</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.map((resource, index) => (
          <React.Fragment key={resource.id}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 bg-muted dark:bg-gray-700 rounded-md">
                {getIconForResource(resource.url)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm dark:text-gray-100">{resource.title}</h4>
                {resource.description && (
                  <p className="text-sm text-muted-foreground dark:text-gray-300 mt-1">{resource.description}</p>
                )}
                <Button 
                  variant="link" 
                  className="h-8 px-0 text-blue-600 dark:text-blue-400 flex items-center gap-1"
                  asChild
                >
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    Visit Resource
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
                
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {resource.tags.map(tag => (
                      <div key={tag} className="flex items-center bg-muted dark:bg-gray-700 text-xs px-2 py-1 rounded-full dark:text-gray-300">
                        <Tag className="h-3 w-3 mr-1 text-muted-foreground dark:text-gray-400" />
                        <span>{tag === "Electrolyte Packs" ? "Electrolytes" : tag}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {index < resources.length - 1 && <Separator className="dark:bg-gray-700" />}
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  );
};

export default CoachResourcesList;
