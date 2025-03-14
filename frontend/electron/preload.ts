import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../src/electron';

const electronAPI: ElectronAPI = {
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);
