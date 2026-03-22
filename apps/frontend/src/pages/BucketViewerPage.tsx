import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileIcon, Type, Link as LinkIcon, Upload, Plus, Trash2,
  FolderOpen, Send, Globe, Lock, Clock, AlertTriangle
} from 'lucide-react';
import { bucketApi, fileApi, contentApi } from '../services/api';
import { wsService } from '../services/websocket';
import { useBucketStore } from '../stores/bucketStore';
import { FileCard } from '../components/FileCard';
import { ContentCard } from '../components/ContentCard';
import { FileUploader } from '../components/FileUploader';
import { PinModal } from '../components/PinModal';

type Tab = 'files' | 'text' | 'links';

export function BucketViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentBucket, setCurrentBucket,
    files, setFiles, removeFile,
    contents, setContents, removeContent,
    isLoading, setLoading, setError
  } = useBucketStore();

  const [activeTab, setActiveTab] = useState<Tab>('files');
  const [showUploader, setShowUploader] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newText, setNewText] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [showAddText, setShowAddText] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);

  const bucketId = id || '';
  const isOwner = !!localStorage.getItem(`owner_token_${bucketId}`);

  const loadBucket = useCallback(async () => {
    setLoading(true);
    try {
      const bucket = await bucketApi.get(bucketId);
      setCurrentBucket(bucket);

      if (bucket.isProtected && !isOwner) {
        const token = sessionStorage.getItem('bucketToken');
        if (!token) {
          setShowPinModal(true);
          setLoading(false);
          return;
        }
      }

      setIsAuthenticated(true);
      const [filesData, contentsData] = await Promise.all([
        fileApi.list(bucketId),
        contentApi.list(bucketId),
      ]);
      setFiles(filesData);
      setContents(contentsData);
    } catch (err: any) {
      if (err.message?.includes('Authentication required')) {
        setShowPinModal(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [bucketId, isOwner]);

  useEffect(() => {
    loadBucket();

    // WebSocket listeners
    const unsubFileAdded = wsService.on('FILE_ADDED', (msg) => {
      if (msg.bucketId === bucketId && msg.data) {
        useBucketStore.getState().addFile(msg.data);
      }
    });
    const unsubFileRemoved = wsService.on('FILE_REMOVED', (msg) => {
      if (msg.bucketId === bucketId && msg.data?.name) {
        useBucketStore.getState().removeFile(msg.data.name);
      }
    });
    const unsubContentAdded = wsService.on('CONTENT_ADDED', (msg) => {
      if (msg.bucketId === bucketId && msg.data) {
        useBucketStore.getState().addContent(msg.data);
      }
    });
    const unsubContentRemoved = wsService.on('CONTENT_REMOVED', (msg) => {
      if (msg.bucketId === bucketId && msg.data?.contentId) {
        useBucketStore.getState().removeContent(msg.data.contentId);
      }
    });

    return () => {
      unsubFileAdded();
      unsubFileRemoved();
      unsubContentAdded();
      unsubContentRemoved();
      setCurrentBucket(null);
      setFiles([]);
      setContents([]);
    };
  }, [bucketId]);

  const handlePinSuccess = (_token: string) => {
    setShowPinModal(false);
    setIsAuthenticated(true);
    loadBucket();
  };

  const handleDeleteFile = async (name: string) => {
    try {
      await fileApi.delete(bucketId, name);
      removeFile(name);
    } catch (err: any) {
      console.error('Delete failed:', err);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    try {
      await contentApi.delete(bucketId, contentId);
      removeContent(contentId);
    } catch (err: any) {
      console.error('Delete failed:', err);
    }
  };

  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    try {
      await contentApi.addText(bucketId, newText.trim());
      setNewText('');
      setShowAddText(false);
    } catch (err: any) {
      console.error('Add text failed:', err);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.trim()) return;
    try {
      await contentApi.addLink(bucketId, newLink.trim(), newLinkLabel.trim() || undefined);
      setNewLink('');
      setNewLinkLabel('');
      setShowAddLink(false);
    } catch (err: any) {
      console.error('Add link failed:', err);
    }
  };

  const handleDeleteBucket = async () => {
    if (!confirm('Are you sure you want to delete this bucket? All files will be lost.')) return;
    try {
      await bucketApi.delete(bucketId);
      navigate('/');
    } catch (err: any) {
      console.error('Delete bucket failed:', err);
    }
  };

  const textContents = contents.filter((c) => c.type === 'text');
  const linkContents = contents.filter((c) => c.type === 'link');

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'files', label: 'Files', icon: <FileIcon size={16} />, count: files.length },
    { key: 'text', label: 'Text', icon: <Type size={16} />, count: textContents.length },
    { key: 'links', label: 'Links', icon: <LinkIcon size={16} />, count: linkContents.length },
  ];

  const getModeInfo = () => {
    if (!currentBucket) return null;
    switch (currentBucket.mode) {
      case 'pin-protected':
        return { icon: <Lock size={14} />, class: 'badge-protected', label: 'Protected' };
      case 'temporary':
        return { icon: <Clock size={14} />, class: 'badge-temporary', label: 'Temporary' };
      default:
        return { icon: <Globe size={14} />, class: 'badge-public', label: 'Public' };
    }
  };

  // PIN Modal
  if (showPinModal && currentBucket) {
    return (
      <PinModal
        bucketId={bucketId}
        bucketName={currentBucket.name}
        onSuccess={handlePinSuccess}
        onClose={() => navigate('/')}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin h-8 w-8 text-primary-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!currentBucket) {
    return (
      <div className="text-center py-32">
        <AlertTriangle size={48} className="text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white">Bucket Not Found</h2>
        <p className="text-surface-400 mt-2">This bucket may have been deleted or expired.</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6">Go Home</button>
      </div>
    );
  }

  const modeInfo = getModeInfo();

  return (
    <div className="space-y-6">
      {/* Bucket Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate('/')} className="btn-ghost mb-3 -ml-3">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-white">{currentBucket.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {modeInfo && (
              <span className={modeInfo.class}>
                {modeInfo.icon}
                {modeInfo.label}
              </span>
            )}
            {isOwner && (
              <span className="badge bg-primary-500/15 text-primary-400 border border-primary-500/20">
                Owner
              </span>
            )}
          </div>
        </div>

        {isOwner && (
          <button onClick={handleDeleteBucket} className="btn-danger text-sm" id="delete-bucket-btn">
            <Trash2 size={14} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.key
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'text-surface-400 hover:text-white hover:bg-white/5'
              }`}
            id={`tab-${tab.key}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-white/5'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* FILES TAB */}
        {activeTab === 'files' && (
          <div className="space-y-4 animate-fade-in">
            {/* Upload Toggle */}
            {isOwner && (
              <button
                onClick={() => setShowUploader(!showUploader)}
                className={`btn-secondary w-full ${showUploader ? 'border-primary-500/30' : ''}`}
                id="toggle-uploader"
              >
                <Upload size={16} />
                {showUploader ? 'Hide Uploader' : 'Upload Files'}
              </button>
            )}

            {/* File Uploader */}
            {showUploader && isOwner && (
              <div className="animate-slide-down">
                <FileUploader bucketId={bucketId} />
              </div>
            )}

            {/* File List */}
            {files.length === 0 ? (
              <div className="text-center py-16 card">
                <FolderOpen size={40} className="text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400">No files yet</p>
                {isOwner && <p className="text-surface-600 text-sm mt-1">Upload files to share them</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <FileCard
                    key={file.name}
                    file={file}
                    bucketId={bucketId}
                    isOwner={isOwner}
                    onDelete={handleDeleteFile}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEXT TAB */}
        {activeTab === 'text' && (
          <div className="space-y-4 animate-fade-in">
            {/* Add Text */}
            {isOwner && (
              <>
                {showAddText ? (
                  <form onSubmit={handleAddText} className="card space-y-3 animate-slide-down">
                    <textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Type a note to share..."
                      className="input-field min-h-[120px] resize-y"
                      autoFocus
                      id="text-input"
                    />
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowAddText(false)} className="btn-ghost">Cancel</button>
                      <button type="submit" disabled={!newText.trim()} className="btn-primary text-sm">
                        <Send size={14} />
                        Share Text
                      </button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setShowAddText(true)} className="btn-secondary w-full" id="add-text-btn">
                    <Plus size={16} />
                    Add Text Note
                  </button>
                )}
              </>
            )}

            {/* Text List */}
            {textContents.length === 0 ? (
              <div className="text-center py-16 card">
                <Type size={40} className="text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400">No text notes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {textContents.map((c) => (
                  <ContentCard key={c.id} content={c} isOwner={isOwner} onDelete={handleDeleteContent} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* LINKS TAB */}
        {activeTab === 'links' && (
          <div className="space-y-4 animate-fade-in">
            {/* Add Link */}
            {isOwner && (
              <>
                {showAddLink ? (
                  <form onSubmit={handleAddLink} className="card space-y-3 animate-slide-down">
                    <input
                      type="url"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="https://example.com"
                      className="input-field"
                      autoFocus
                      id="link-input"
                    />
                    <input
                      type="text"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      placeholder="Label (optional)"
                      className="input-field"
                      id="link-label-input"
                    />
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowAddLink(false)} className="btn-ghost">Cancel</button>
                      <button type="submit" disabled={!newLink.trim()} className="btn-primary text-sm">
                        <Send size={14} />
                        Share Link
                      </button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setShowAddLink(true)} className="btn-secondary w-full" id="add-link-btn">
                    <Plus size={16} />
                    Add Link
                  </button>
                )}
              </>
            )}

            {/* Links List */}
            {linkContents.length === 0 ? (
              <div className="text-center py-16 card">
                <LinkIcon size={40} className="text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400">No links shared</p>
              </div>
            ) : (
              <div className="space-y-2">
                {linkContents.map((c) => (
                  <ContentCard key={c.id} content={c} isOwner={isOwner} onDelete={handleDeleteContent} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
