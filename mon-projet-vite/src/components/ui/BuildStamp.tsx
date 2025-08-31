import React from 'react';
import { BUILD_INFO, APP_VERSION } from '../../version';
import { GitBranch, Clock, Hash } from 'lucide-react';

export const BuildStamp: React.FC = () => {
  const isProduction = BUILD_INFO.context === 'production';
  
  return (
    <div className={`fixed bottom-2 left-2 text-xs px-2 py-1 rounded shadow-sm z-50 ${
      isProduction 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-blue-100 text-blue-800 border border-blue-200'
    }`}>
      <div className="flex items-center gap-1">
        <span className="font-semibold">v{APP_VERSION}</span>
        <GitBranch size={10} />
        <span>{BUILD_INFO.branch}</span>
        <Hash size={10} />
        <span className="font-mono">{BUILD_INFO.commitRef}</span>
        <Clock size={10} />
        <span>{new Date(BUILD_INFO.buildTime).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}</span>
      </div>
      {!isProduction && (
        <div className="text-[10px] opacity-75 mt-1">
          DEV BUILD - {BUILD_INFO.context}
        </div>
      )}
    </div>
  );
};
