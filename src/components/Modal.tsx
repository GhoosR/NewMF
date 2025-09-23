import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  fullScreenOnMobile?: boolean;
  fullScreenOnMobile?: boolean;
}

export function Modal({ title, onClose, children, fullScreenOnMobile = false }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-background ${fullScreenOnMobile ? 'w-full h-full md:w-auto md:h-auto md:max-w-4xl md:rounded-lg md:max-h-[90vh]' : 'w-full max-w-4xl max-h-[90vh] rounded-lg'} overflow-y-auto mx-auto ${fullScreenOnMobile ? '' : 'mx-4'}`}>
        <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b border-accent-text/10 bg-background">
          <h2 className="text-2xl font-semibold text-content">{title}</h2>
          <button 
            onClick={onClose}
            className="text-content/60 hover:text-content"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}