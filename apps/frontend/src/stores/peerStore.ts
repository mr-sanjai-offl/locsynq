import { create } from 'zustand';

interface Device {
  id: string;
  name: string;
  ip: string;
  port: number;
}

interface PeerState {
  self: Device | null;
  peers: Device[];
  isConnected: boolean;

  setSelf: (device: Device) => void;
  setPeers: (peers: Device[]) => void;
  setConnected: (connected: boolean) => void;
}

export const usePeerStore = create<PeerState>((set) => ({
  self: null,
  peers: [],
  isConnected: false,

  setSelf: (self) => set({ self }),
  setPeers: (peers) => set({ peers }),
  setConnected: (isConnected) => set({ isConnected }),
}));
