
import React, { useState } from 'react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ExerciseImportPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'json' | 'csv'>('json');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const { data, error } = await supabase.functions.invoke('import-exercises', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Import successful',
        description: `${data.count} exercises were imported.`,
        variant: 'default',
      });

      // Reset form
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'An error occurred during import',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Container className="px-4 py-8 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Import Exercise Data</h1>
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

          <div className="mt-4 text-sm text-slate-500">
            <h3 className="font-medium mb-1">File Format Requirements:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>JSON</strong>: Array of objects with name, category, and optional description and exercise_type</li>
              <li><strong>CSV</strong>: First row as headers, must include name and category columns</li>
            </ul>
          </div>
        </div>
      </Card>
    </Container>
  );
};

export default ExerciseImportPage;
