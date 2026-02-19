import React from 'react';
import { LayoutDashboard, FileCode, ShoppingBag, Settings, Zap } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.EDITOR, label: 'Patch Editor', icon: FileCode },
    { id: AppView.STORE, label: 'Mod Store', icon: ShoppingBag },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-nexus-800 h-screen border-r border-nexus-700 flex flex-col justify-between">
      <div>
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-nexus-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,255,157,0.5)]">
            <Zap size={20} className="text-nexus-900" />
          </div>
          <span className="font-bold text-xl tracking-wider text-white">MOD<span className="text-nexus-accent">GEN</span></span>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-nexus-700 text-nexus-accent border border-nexus-accent/20'
                  : 'text-gray-400 hover:bg-nexus-700/50 hover:text-white'
              }`}
            >
              <item.icon size={18} className={`transition-colors ${currentView === item.id ? 'text-nexus-accent' : 'text-gray-500 group-hover:text-white'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4">
        <div className="rounded-xl p-4 bg-nexus-700/30 border border-nexus-700">
            <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    System Online
                </span>
            </div>
            <p className="text-xs text-gray-400">
                Connected to Modgen Cloud. All modules loaded.
            </p>
        </div>
      </div>
    </div>
  );
};