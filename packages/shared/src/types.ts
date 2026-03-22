// ─── Device ───
export interface Device {
  id: string;
  name: string;
  ip: string;
  port: number;
}

// ─── Bucket ───
export type BucketMode = 'public' | 'pin-protected' | 'temporary';

export interface Bucket {
  id: string;
  name: string;
  hostId: string;
  mode: BucketMode;
  isProtected: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface BucketCreateRequest {
  name: string;
  mode: BucketMode;
  pin?: string;
  expiresInMinutes?: number;
}

export interface BucketCreateResponse {
  bucket: Bucket;
  ownerToken: string;
}

// ─── Files ───
export interface BucketFile {
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

// ─── Content ───
export type ContentType = 'text' | 'link';

export interface BucketContent {
  id: string;
  type: ContentType;
  value: string;
  label?: string;
  createdAt: string;
}

export interface AddTextRequest {
  value: string;
  label?: string;
}

export interface AddLinkRequest {
  url: string;
  label?: string;
}

// ─── Auth ───
export interface AuthRequest {
  pin: string;
}

export interface AuthResponse {
  token: string;
  bucketId: string;
}

// ─── WebSocket Events ───
export enum WSEventType {
  BUCKET_CREATED = 'BUCKET_CREATED',
  BUCKET_DELETED = 'BUCKET_DELETED',
  FILE_ADDED = 'FILE_ADDED',
  FILE_REMOVED = 'FILE_REMOVED',
  CONTENT_ADDED = 'CONTENT_ADDED',
  CONTENT_REMOVED = 'CONTENT_REMOVED',
  PEER_JOINED = 'PEER_JOINED',
  PEER_LEFT = 'PEER_LEFT',
}

export interface WSMessage {
  event: WSEventType;
  bucketId?: string;
  data?: any;
  timestamp: string;
}

// ─── API Response Wrapper ───
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
