import { Download, Trash2, FileIcon, FileText, FileImage, FileArchive, FileVideo, FileAudio, FileCode } from 'lucide-react';
import { fileApi } from '../services/api';

interface FileCardProps {
  file: {
    name: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
  };
  bucketId: string;
  isOwner: boolean;
  onDelete?: (name: string) => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <FileImage size={20} className="text-emerald-400" />;
  if (mimeType.startsWith('video/')) return <FileVideo size={20} className="text-purple-400" />;
  if (mimeType.startsWith('audio/')) return <FileAudio size={20} className="text-amber-400" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gzip'))
    return <FileArchive size={20} className="text-orange-400" />;
  if (mimeType.includes('text') || mimeType.includes('pdf') || mimeType.includes('document'))
    return <FileText size={20} className="text-blue-400" />;
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('xml'))
    return <FileCode size={20} className="text-cyan-400" />;
  return <FileIcon size={20} className="text-surface-400" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function FileCard({ file, bucketId, isOwner, onDelete }: FileCardProps) {
  const handleDownload = () => {
    const url = fileApi.getDownloadUrl(bucketId, file.name);

    // Add auth token to download URL
    const token = sessionStorage.getItem('bucketToken') || sessionStorage.getItem(`ownerToken_${bucketId}`);
    if (token) {
      window.open(`${url}?token=${token}`, '_blank');
    } else {
      // Use anchor click for download
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4 group hover:bg-white/[0.07] transition-all animate-fade-in" id={`file-${file.name}`}>
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
        {getFileIcon(file.mimeType)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate" title={file.originalName}>
          {file.originalName || file.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-surface-500 mt-0.5">
          <span>{formatSize(file.size)}</span>
          <span>•</span>
          <span>{timeAgo(file.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          className="btn-ghost text-primary-400 hover:text-primary-300"
          title="Download"
        >
          <Download size={16} />
        </button>
        {isOwner && onDelete && (
          <button
            onClick={() => onDelete(file.name)}
            className="btn-ghost text-surface-500 hover:text-rose-400"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
