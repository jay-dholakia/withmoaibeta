
import React, { useState } from 'react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileDown, AlertTriangle, Globe } from 'lucide-react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const ExerciseImportPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'json' | 'csv'>('csv');
  const [isUploading, setIsUploading] = useState(false);
  const [checkExisting, setCheckExisting] = useState(true);
  const [apiImportLimit, setApiImportLimit] = useState<string>("50");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-detect file type from extension
      if (selectedFile.name.endsWith('.json')) {
        setFileType('json');
      } else if (selectedFile.name.endsWith('.csv')) {
        setFileType('csv');
      }
    }
  };

  const handleFileImport = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      formData.append('checkExisting', checkExisting.toString());

      const { data, error } = await supabase.functions.invoke('import-exercises', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Processed ${data.total} exercises: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped.`);

      // Reset form
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred during import');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApiImport = async () => {
    setIsUploading(true);

    try {
      const { data, error } = await supabase.functions.invoke('import-rapidapi-exercises', {
        body: {
          shouldCheckExisting: checkExisting, 
          limit: apiImportLimit === "all" ? null : parseInt(apiImportLimit)
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Processed ${data.total} exercises from RapidAPI: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped.`);
    } catch (error) {
      console.error('RapidAPI import error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred during API import');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = (type: 'json' | 'csv') => {
    const fileName = type === 'json' ? 'sample-exercises.json' : 'sample-exercises.csv';
    window.open(`/${fileName}`, '_blank');
  };

  return (
    <AdminDashboardLayout title="Import Exercise Data">
      <Tabs defaultValue="file" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="file">File Import</TabsTrigger>
          <TabsTrigger value="api">RapidAPI Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="file">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="file-upload">
                  Upload File (JSON or CSV)
                </label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileChange}
                  className="w-full"
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">File Format</p>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="json"
                      checked={fileType === 'json'}
                      onChange={() => setFileType('json')}
                      className="form-radio"
                    />
                    <span>JSON</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="csv"
                      checked={fileType === 'csv'}
                      onChange={() => setFileType('csv')}
                      className="form-radio"
                    />
                    <span>CSV</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="check-existing" 
                  checked={checkExisting}
                  onCheckedChange={(checked) => setCheckExisting(checked as boolean)}
                />
                <label 
                  htmlFor="check-existing" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Check for existing exercises (safer, prevents duplicates and reference errors)
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                  <p className="text-sm text-amber-800">
                    When enabled, exercises already used in personal records will be preserved to prevent data loss. 
                    This option is recommended.
                  </p>
                </div>
              </div>

              {file && (
                <div className="text-sm">
                  Selected file: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleFileImport}
                  disabled={!file || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                    </>
                  ) : (
                    'Import Exercises from File'
                  )}
                </Button>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Sample Files:</p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadSample('json')}
                  >
                    <FileDown className="mr-1 h-4 w-4" /> Download JSON Sample
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadSample('csv')}
                  >
                    <FileDown className="mr-1 h-4 w-4" /> Download CSV Sample
                  </Button>
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-500">
                <h3 className="font-medium mb-1">File Format Requirements:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>JSON</strong>: Array of objects with name, category, and optional description and exercise_type</li>
                  <li><strong>CSV</strong>: First row as headers, must include name and category columns</li>
                  <li>If exercise_type is not specified, it defaults to "strength"</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Import from RapidAPI Exercise Database</h3>
                <p className="text-sm text-slate-500 mt-1">
                  This will import exercise data directly from the ExerciseDB API on RapidAPI.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-limit">Import Limit</Label>
                <Select
                  value={apiImportLimit}
                  onValueChange={setApiImportLimit}
                >
                  <SelectTrigger className="w-full md:w-1/3">
                    <SelectValue placeholder="Select import limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 exercises</SelectItem>
                    <SelectItem value="20">20 exercises</SelectItem>
                    <SelectItem value="50">50 exercises</SelectItem>
                    <SelectItem value="100">100 exercises</SelectItem>
                    <SelectItem value="200">200 exercises</SelectItem>
                    <SelectItem value="all">All exercises</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Choose how many exercises to import. Start small to test.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="check-existing-api" 
                  checked={checkExisting}
                  onCheckedChange={(checked) => setCheckExisting(checked as boolean)}
                />
                <label 
                  htmlFor="check-existing-api" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Check for existing exercises (safer, prevents duplicates and reference errors)
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                  <p className="text-sm text-amber-800">
                    When enabled, exercises already used in personal records will be preserved to prevent data loss. 
                    This option is recommended.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleApiImport}
                  disabled={isUploading}
                  className="w-full"
                  variant="default"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                    </>
                  ) : (
                    'Import from RapidAPI'
                  )}
                </Button>
              </div>

              <div className="mt-2 text-sm text-slate-500">
                <p>
                  Data is imported from the ExerciseDB API and mapped to match our database schema.
                  Make sure you have configured your RapidAPI key in Edge Function secrets.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminDashboardLayout>
  );
};

export default ExerciseImportPage;
