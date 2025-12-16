'use client';

import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-1 border-b border-md-outline-variant">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative px-6 py-3 text-sm font-medium transition-colors
            ${
              activeTab === tab.id
                ? 'text-md-accent'
                : 'text-md-on-surface-variant hover:text-md-on-surface'
            }
          `}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-md-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
