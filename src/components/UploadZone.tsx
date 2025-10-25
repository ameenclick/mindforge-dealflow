import { useCallback, useState } from "react";
import { Upload, File, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  file: File;
  type: 'profile' | 'financial';
}

interface UploadZoneProps {
  onFilesChange: (files: UploadedFile[]) => void;
}

export const UploadZone = ({ onFilesChange }: UploadZoneProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const processFiles = (fileList: File[]) => {
    const validExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
    const validFiles = fileList.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return validExtensions.includes(ext);
    });

    if (validFiles.length !== fileList.length) {
      toast({
        title: "Invalid files detected",
        description: "Only PDF, PPT, DOC, XLS, and CSV files are supported",
        variant: "destructive",
      });
    }

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: file.name.toLowerCase().includes('financial') || 
            file.name.toLowerCase().includes('statement') ||
            ['.xls', '.xlsx', '.csv'].some(ext => file.name.toLowerCase().endsWith(ext))
            ? 'financial' 
            : 'profile'
    }));

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);

    toast({
      title: "Files uploaded",
      description: `${newFiles.length} file(s) added successfully`,
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
          dragActive 
            ? 'border-primary bg-primary/5 shadow-glow' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-4 pointer-events-none">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, PPT, DOC, XLS, CSV files supported
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Uploaded Files</h3>
          <div className="space-y-2">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${
                    uploadedFile.type === 'financial' 
                      ? 'bg-accent/10 text-accent' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    <File className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{uploadedFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.file.size / 1024).toFixed(1)} KB • {uploadedFile.type === 'financial' ? 'Financial' : 'Profile'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
