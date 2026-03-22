import { create } from 'zustand';

interface Bucket {
  id: string;
  name: string;
  hostId: string;
  mode: string;
  isProtected: boolean;
  createdAt: string;
  expiresAt?: string;
}

interface BucketFile {
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

interface BucketContent {
  id: string;
  type: 'text' | 'link';
  value: string;
  label?: string;
  createdAt: string;
}

interface BucketState {
  buckets: Bucket[];
  currentBucket: Bucket | null;
  files: BucketFile[];
  contents: BucketContent[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  isUploading: boolean;

  setBuckets: (buckets: Bucket[]) => void;
  addBucket: (bucket: Bucket) => void;
  removeBucket: (id: string) => void;
  setCurrentBucket: (bucket: Bucket | null) => void;
  setFiles: (files: BucketFile[]) => void;
  addFile: (file: BucketFile) => void;
  removeFile: (name: string) => void;
  setContents: (contents: BucketContent[]) => void;
  addContent: (content: BucketContent) => void;
  removeContent: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUploadProgress: (progress: number) => void;
  setUploading: (uploading: boolean) => void;
}

export const useBucketStore = create<BucketState>((set) => ({
  buckets: [],
  currentBucket: null,
  files: [],
  contents: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,
  isUploading: false,

  setBuckets: (buckets) => set({ buckets }),
  addBucket: (bucket) => set((s) => ({ buckets: [...s.buckets, bucket] })),
  removeBucket: (id) => set((s) => ({ buckets: s.buckets.filter((b) => b.id !== id) })),
  setCurrentBucket: (bucket) => set({ currentBucket: bucket }),
  setFiles: (files) => set({ files }),
  addFile: (file) =>
    set((s) => ({
      files: [...s.files.filter((f) => f.name !== file.name), file],
    })),
  removeFile: (name) => set((s) => ({ files: s.files.filter((f) => f.name !== name) })),
  setContents: (contents) => set({ contents }),
  addContent: (content) => set((s) => ({ contents: [...s.contents, content] })),
  removeContent: (id) => set((s) => ({ contents: s.contents.filter((c) => c.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  setUploading: (isUploading) => set({ isUploading }),
}));
