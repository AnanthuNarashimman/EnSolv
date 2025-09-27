import React from 'react';
import { Toaster } from 'react-hot-toast';

interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * ToastProvider - Provides toast notifications for the app
 * Using react-hot-toast for user-friendly error messages
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 5000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(130, 71, 229, 0.1)',
            borderRadius: '12px',
            color: '#1a1b23',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            maxWidth: '400px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: 'white',
            },
            style: {
              border: '1px solid rgba(34, 197, 94, 0.2)',
            },
          },
          error: {
            duration: 7000,
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.2)',
            },
          },
          loading: {
            iconTheme: {
              primary: '#8247e5',
              secondary: 'white',
            },
            style: {
              border: '1px solid rgba(130, 71, 229, 0.2)',
            },
          },
        }}
      />
    </>
  );
};