declare global {
  interface Window {
    __taskiumAccess?: Record<string, boolean>;
  }
}

export {};
