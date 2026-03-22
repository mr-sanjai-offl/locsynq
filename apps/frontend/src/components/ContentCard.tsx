import { Copy, ExternalLink, Trash2, Type, Link as LinkIcon } from 'lucide-react';

interface ContentCardProps {
  content: {
    id: string;
    type: 'text' | 'link';
    value: string;
    label?: string;
    createdAt: string;
  };
  isOwner: boolean;
  onDelete?: (id: string) => void;
}

export function ContentCard({ content, isOwner, onDelete }: ContentCardProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content.value);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = content.value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="glass rounded-xl p-4 group hover:bg-white/[0.07] transition-all animate-fade-in" id={`content-${content.id}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          content.type === 'text' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
        }`}>
          {content.type === 'text' ? (
            <Type size={16} className="text-blue-400" />
          ) : (
            <LinkIcon size={16} className="text-emerald-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {content.label && (
            <p className="text-xs text-surface-400 mb-1">{content.label}</p>
          )}
          {content.type === 'text' ? (
            <p className="text-sm text-white whitespace-pre-wrap break-words">{content.value}</p>
          ) : (
            <a
              href={content.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-400 hover:text-primary-300 hover:underline break-all inline-flex items-center gap-1"
            >
              {content.value}
              <ExternalLink size={12} className="flex-shrink-0" />
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={handleCopy} className="btn-ghost" title="Copy">
            <Copy size={14} />
          </button>
          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(content.id)}
              className="btn-ghost text-surface-500 hover:text-rose-400"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
