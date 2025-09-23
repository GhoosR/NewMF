import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

interface CertificatePreviewProps {
  url: string;
}

export function CertificatePreview({ url }: CertificatePreviewProps) {
  const isPDF = url.toLowerCase().endsWith('.pdf');

  return (
    <div className="mt-4 border border-accent-text/10 rounded-lg p-4 bg-accent-base/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-sm text-content/80">
          <FileText className="h-4 w-4 mr-2" />
          <span>Certification Document</span>
        </div>
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-text hover:text-accent-text/80 flex items-center"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          <span className="text-sm">View</span>
        </a>
      </div>

      {!isPDF && (
        <div className="mt-2 rounded-lg overflow-hidden border border-accent-text/10">
          <img 
            src={url} 
            alt="Certification" 
            className="w-full h-48 object-cover"
          />
        </div>
      )}
    </div>
  );
}