import { useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Hook pour gérer les toasts
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 4000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      duration,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  // Fonctions spécialisées
  const success = (title: string, message?: string) =>
    addToast('success', title, message);
  
  const error = (title: string, message?: string) =>
    addToast('error', title, message, 6000); // Plus long pour les erreurs
  
  const warning = (title: string, message?: string) =>
    addToast('warning', title, message);
  
  const info = (title: string, message?: string) =>
    addToast('info', title, message);

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };
}
