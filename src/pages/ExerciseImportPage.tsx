import React, { useState } from 'react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileDown, AlertTriangle } from 'lucide-react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ExerciseImportPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'json' | 'csv'>('csv');
  const [isUploading, setIsUploading] = useState(false);
  const [checkExisting, setCheckExisting] = useState(true);
  const [invalidUrls, setInvalidUrls] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      if (selectedFile.name.endsWith('.json')) {
        setFileType('json');
      } else if (selectedFile.name.endsWith('.csv')) {
        setFileType('csv');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setInvalidUrls([]);

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

      if (data.invalid_urls && data.invalid_urls.length > 0) {
        setInvalidUrls(data.invalid_urls);
        toast.warning(`${data.invalid_urls.length} exercises had invalid YouTube URLs and were imported without links`);
      }

      toast.success(`Processed ${data.total} exercises: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped.`);

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

  const handleDownloadSample = (type: 'json' | 'csv') => {
    const fileName = type === 'json' ? 'sample-exercises.json' : 'sample-exercises.csv';
    window.open(`/${fileName}`, '_blank');
  };

  return (
    <AdminDashboardLayout title="Import Exercise Data">
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

          {invalidUrls.length > 0 && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">The following exercises had invalid YouTube URLs:</p>
                <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground">
                  {invalidUrls.map((name, i) => (
                    <div key={i} className="mb-1">{name}</div>
                  ))}
                </div>
                <p className="mt-2 text-sm">These exercises were imported without YouTube links.</p>
              </AlertDescription>
            </Alert>
          )}

          {file && (
            <div className="text-sm">
              Selected file: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={handleImport}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                </>
              ) : (
                'Import Exercises'
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
              <li>YouTube links must be valid URLs starting with http:// or https://</li>
            </ul>
          </div>
        </div>
      </Card>
    </AdminDashboardLayout>
  );
};

export default ExerciseImportPage;
