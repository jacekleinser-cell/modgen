import React, { useEffect, useRef } from 'react';
import { PatchLog } from '../types';

interface TerminalProps {
  logs: PatchLog[];
  isProcessing: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, isProcessing }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="bg-nexus-900 rounded-lg border border-nexus-700 font-mono text-xs md:text-sm h-64 flex flex-col shadow-inner overflow-hidden relative">
      <div className="bg-nexus-800 px-4 py-2 flex items-center justify-between border-b border-nexus-700">
        <span className="text-gray-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Modgen_Core_Terminal
        </span>
        <span className="text-nexus-accent text-xs opacity-50">v2.4.1-stable</span>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-1 relative">
        {logs.map((log, index) => (
          <div key={index} className={`flex gap-3 ${
            log.type === 'error' ? 'text-nexus-danger' : 
            log.type === 'success' ? 'text-nexus-accent' : 
            log.type === 'code' ? 'text-blue-300 pl-4 border-l-2 border-blue-500/30' : 
            log.type === 'warning' ? 'text-nexus-warning' : 'text-gray-400'
          }`}>
            <span className="opacity-50 select-none">[{log.timestamp}]</span>
            <span className="whitespace-pre-wrap">{log.message}</span>
          </div>
        ))}
        
        {isProcessing && (
          <div className="text-nexus-accent animate-pulse">
            > Processing request... <span className="inline-block w-2 h-4 bg-nexus-accent align-middle ml-1 animate-pulse"></span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* CRT Scanline Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20"></div>
    </div>
  );
};