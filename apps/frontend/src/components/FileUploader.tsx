import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileIcon, CheckCircle2 } from 'lucide-react';
import { fileApi } from '../services/api';
import { useBucketStore } from '../stores/bucketStore';

interface FileUploaderProps {
  bucketId: string;
}

export function FileUploader({ bucketId }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFile } = useBucketStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    setUploadComplete(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
      setUploadComplete(false);
    }
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);

    try {
      const result = await fileApi.upload(bucketId, selectedFiles, (progress) => {
        setUploadProgress(progress);
      });

      // Add files to store
      result.forEach((f: any) => addFile(f));

      setSelectedFiles([]);
      setUploadProgress(100);
      setUploadComplete(true);
      setTimeout(() => setUploadComplete(false), 3000);
    } catch (err: any) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-out group
          ${dragOver
            ? 'border-primary-400 bg-primary-500/10 scale-[1.02]'
            : 'border-white/10 hover:border-primary-500/30 hover:bg-white/5'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload-input"
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            dragOver ? 'bg-primary-500/20 scale-110' : 'bg-white/5 group-hover:bg-white/10'
          }`}>
            <Upload size={24} className={`${dragOver ? 'text-primary-400' : 'text-surface-400 group-hover:text-primary-400'} transition-colors`} />
          </div>
          <div>
            <p className="text-white font-medium">Drag & drop files here</p>
            <p className="text-surface-500 text-sm mt-1">or click to browse • supports files up to 5GB</p>
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 animate-slide-up">
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
              <FileIcon size={18} className="text-primary-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-surface-500">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                className="text-surface-500 hover:text-rose-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="btn-primary w-full"
            id="upload-btn"
          >
            {isUploading ? (
              <span>Uploading... {uploadProgress}%</span>
            ) : (
              <>
                <Upload size={16} />
                Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </button>

          {/* Progress Bar */}
          {isUploading && (
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Complete */}
      {uploadComplete && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm animate-fade-in">
          <CheckCircle2 size={16} />
          <span>Files uploaded successfully!</span>
        </div>
      )}
    </div>
  );
}
