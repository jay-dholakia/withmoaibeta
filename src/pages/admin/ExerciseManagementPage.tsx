
import React, { useState, useEffect } from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Edit, 
  Youtube, 
  Search, 
  Loader2, 
  Filter, 
  RotateCcw,
  Pencil,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { Exercise, STANDARD_WORKOUT_TYPES } from '@/types/workout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const ExerciseManagementPage = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [sortField, setSortField] = useState<'name' | 'category' | 'exercise_type'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  useEffect(() => {
    fetchExercises();
    fetchCategories();
  }, []);
  
  const fetchExercises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('category')
        .order('category');
        
      if (error) {
        throw error;
      }
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  const openEditDialog = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setYoutubeLink(exercise.youtube_link || '');
    setIsEditDialogOpen(true);
  };
  
  const handleSaveYoutubeLink = async () => {
    if (!currentExercise) return;
    
    try {
      const { error } = await supabase
        .from('exercises')
        .update({ youtube_link: youtubeLink })
        .eq('id', currentExercise.id);
        
      if (error) {
        throw error;
      }
      
      toast.success('YouTube link updated successfully');
      
      // Update the local exercises state
      setExercises(exercises.map(ex => 
        ex.id === currentExercise.id ? { ...ex, youtube_link: youtubeLink } : ex
      ));
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating YouTube link:', error);
      toast.error('Failed to update YouTube link');
    }
  };
  
  const handleSort = (field: 'name' | 'category' | 'exercise_type') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Filter exercises based on search term and filters
  const filteredExercises = exercises
    .filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(ex => !categoryFilter || ex.category === categoryFilter)
    .filter(ex => !typeFilter || ex.exercise_type === typeFilter)
    .sort((a, b) => {
      const fieldA = a[sortField]?.toLowerCase() || '';
      const fieldB = b[sortField]?.toLowerCase() || '';
      
      if (sortDirection === 'asc') {
        return fieldA.localeCompare(fieldB);
      } else {
        return fieldB.localeCompare(fieldA);
      }
    });
  
  const openYoutubeLink = (link: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setTypeFilter('');
  };
  
  return (
    <AdminDashboardLayout title="Exercise Management">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Exercise YouTube Links</CardTitle>
          <CardDescription>
            Add or edit YouTube video links for exercises to provide visual demonstrations to clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search exercises..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category || "unknown"}>{category || "Unknown"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Exercise Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {STANDARD_WORKOUT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="w-[40%] cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Exercise Name
                    {sortField === 'name' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead 
                    className="w-[20%] cursor-pointer"
                    onClick={() => handleSort('category')}
                  >
                    Category
                    {sortField === 'category' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead 
                    className="w-[20%] cursor-pointer"
                    onClick={() => handleSort('exercise_type')}
                  >
                    Type
                    {sortField === 'exercise_type' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead className="w-[20%] text-right">YouTube Link</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredExercises.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No exercises found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExercises.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">{exercise.name}</TableCell>
                      <TableCell>{exercise.category}</TableCell>
                      <TableCell>{exercise.exercise_type}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          {exercise.youtube_link && (
                            <Button 
                              variant="ghost"
                              size="icon"
                              onClick={() => openYoutubeLink(exercise.youtube_link || '')}
                              title="Open YouTube link"
                            >
                              <ExternalLink className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(exercise)}
                            className="flex items-center"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            {exercise.youtube_link ? 'Edit Link' : 'Add Link'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentExercise?.youtube_link 
                ? 'Edit YouTube Link' 
                : 'Add YouTube Link'
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4 font-medium">{currentExercise?.name}</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                YouTube Video URL
              </label>
              <div className="flex">
                <Youtube className="h-5 w-5 text-red-500 mr-2 self-center" />
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the full YouTube video URL for this exercise
              </p>
            </div>
            
            {youtubeLink && (
              <Button 
                variant="outline" 
                className="mb-4"
                onClick={() => openYoutubeLink(youtubeLink)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Link
              </Button>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveYoutubeLink}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
};

export default ExerciseManagementPage;
