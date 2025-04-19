
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
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Youtube, 
  Search, 
  Loader2, 
  Filter, 
  RotateCcw,
  ArrowUpDown,
  ExternalLink,
  Dumbbell
} from 'lucide-react';
import { Exercise, STANDARD_WORKOUT_TYPES } from '@/types/workout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ExerciseManagementPage = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>("_all");
  const [typeFilter, setTypeFilter] = useState<string>("_all");
  const [categories, setCategories] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [sortField, setSortField] = useState<'name' | 'category' | 'exercise_type'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<string>('youtube');
  
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
      
      setExercises(data as Exercise[]);
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
    setActiveTab('youtube');
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
      
      setExercises(exercises.map(ex => 
        ex.id === currentExercise.id ? { ...ex, youtube_link: youtubeLink } : ex
      ));
      
      setIsEditDialogOpen(false);
      fetchExercises();
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
  
  const filteredExercises = exercises
    .filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(ex => categoryFilter === "_all" || ex.category === categoryFilter)
    .filter(ex => typeFilter === "_all" || ex.exercise_type === typeFilter)
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
    setCategoryFilter("_all");
    setTypeFilter("_all");
  };

  return (
    <AdminDashboardLayout title="Exercise Management">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Exercises</CardTitle>
          <CardDescription>
            Add YouTube video links for exercises.
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
                  <SelectItem value="_all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category || "uncategorized"}>{category || "Uncategorized"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Exercise Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Types</SelectItem>
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
                    className="w-[25%] cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Exercise Name
                    {sortField === 'name' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead 
                    className="w-[15%] cursor-pointer"
                    onClick={() => handleSort('category')}
                  >
                    Category
                    {sortField === 'category' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead 
                    className="w-[15%] cursor-pointer"
                    onClick={() => handleSort('exercise_type')}
                  >
                    Type
                    {sortField === 'exercise_type' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortDirection === 'desc' ? 'rotate-180 transform' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead className="w-[20%] text-right">Actions</TableHead>
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
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(exercise)}
                          className="flex items-center"
                        >
                          <Youtube className="h-4 w-4 mr-1 text-red-500" />
                          YouTube
                        </Button>
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Edit Exercise: {currentExercise?.name}
            </DialogTitle>
            <DialogDescription>
              Manage YouTube link for the exercise
            </DialogDescription>
          </DialogHeader>
          
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
