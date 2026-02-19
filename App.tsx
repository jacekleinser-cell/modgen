
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { INITIAL_MODS } from './constants';
import { AppView, ModOption, FileData } from './types';
import { ShoppingCart, Wrench, FileCode } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [mods, setMods] = useState<ModOption[]>(INITIAL_MODS);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  const toggleMod = (id: string) => {
    setMods(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  const updateMod = (id: string, updates: Partial<ModOption>) => {
      setMods(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            mods={mods} 
            onToggleMod={toggleMod}
            updateMod={updateMod}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
          />
        );
      case AppView.EDITOR:
        return (
          <div className="p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                  <FileCode className="text-nexus-accent" />
                  Patch Editor Configuration
              </h2>
              
              {!selectedFile ? (
                  <div className="text-center p-12 bg-nexus-800 rounded-xl border border-nexus-700 border-dashed">
                      <p className="text-gray-400 mb-4">No active file context.</p>
                      <button 
                          onClick={() => setCurrentView(AppView.DASHBOARD)}
                          className="px-6 py-2 bg-nexus-700 text-nexus-accent rounded-lg hover:bg-nexus-600 transition-colors"
                      >
                          Select a file in Dashboard
                      </button>
                  </div>
              ) : (
                  <div className="space-y-6">
                      <div className="bg-nexus-800 p-6 rounded-xl border border-nexus-700 shadow-lg">
                           <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Target Binary</p>
                           <p className="text-2xl font-mono text-white tracking-tight">{selectedFile.name}</p>
                           <p className="text-sm text-gray-400 mt-1">{selectedFile.size} • {selectedFile.type.split('/').pop()?.toUpperCase() || 'UNKNOWN'}</p>
                      </div>

                      <div className="animate-fade-in-up">
                          <h3 className="text-lg font-semibold mb-4 text-gray-300 border-b border-nexus-700 pb-2">Active Modules</h3>
                          <div className="space-y-3">
                              {mods.filter(m => m.active).length === 0 ? (
                                   <div className="p-6 bg-nexus-900/50 rounded-lg border border-nexus-700/50 text-gray-500 italic text-center">
                                     No modifications enabled. Enable them in the Dashboard to configure parameters.
                                   </div>
                              ) : (
                                  mods.filter(m => m.active).map(mod => (
                                      <div key={mod.id} className="bg-nexus-800 border-l-4 border-nexus-accent p-5 rounded-r-lg shadow-md transition-all hover:bg-nexus-700/80">
                                          <div className="flex justify-between items-center mb-2">
                                              <span className="font-bold text-nexus-accent text-lg">{mod.name}</span>
                                              <span className="text-[10px] font-bold bg-nexus-900 text-gray-400 px-2 py-1 rounded border border-nexus-700 uppercase tracking-wider">{mod.category}</span>
                                          </div>
                                          <p className="text-sm text-gray-300 leading-relaxed font-mono opacity-90">
                                              {mod.description}
                                          </p>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
        );
      case AppView.STORE:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
            <div className="p-6 bg-nexus-800 rounded-full">
                <ShoppingCart size={48} className="text-nexus-accent" />
            </div>
            <h2 className="text-2xl font-bold text-white">Mod Store Offline</h2>
            <p>Connect to Nexus Network to browse community mods.</p>
          </div>
        );
      case AppView.SETTINGS:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
             <div className="p-6 bg-nexus-800 rounded-full">
                <Wrench size={48} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <p>System configuration unavailable in demo mode.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-nexus-900 text-gray-200 overflow-hidden font-sans selection:bg-nexus-accent selection:text-nexus-900">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
      />
      
      <main className="flex-1 h-full bg-[#050508] relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508] pointer-events-none"></div>
        
        <div className="relative h-full z-10">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
