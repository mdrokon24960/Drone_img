'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { Detection } from '@/types/detection';

interface LegendPanelProps {
  detections: Detection[];
  hiddenClasses: Set<string>;
  toggleHiddenClass: (label: string) => void;
}

export default function LegendPanel({
  detections,
  hiddenClasses,
  toggleHiddenClass,
}: LegendPanelProps) {
  // Get unique classes with their colors
  const classes = Array.from(
    new Map(detections.map((d) => [d.label, d.color])).entries()
  ).map(([label, color]) => ({ label, color }));

  if (classes.length === 0) return null;

  return (
    <div className="absolute bottom-24 left-6 glass-dark p-4 rounded-3xl border border-white/10 shadow-2xl z-40 max-w-[240px]">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Layers className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Class Legend</span>
      </div>
      
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {classes.map((c) => {
          const isVisible = !hiddenClasses.has(c.label);
          return (
            <button
              key={c.label}
              onClick={() => toggleHiddenClass(c.label)}
              className="flex items-center gap-3 w-full group transition-all"
            >
              <div 
                className={`w-3 h-3 rounded-full shadow-sm transition-all ${!isVisible ? 'opacity-20 scale-75' : 'scale-100'}`} 
                style={{ backgroundColor: c.color }} 
              />
              <span className={`text-[11px] font-bold uppercase tracking-tight transition-colors ${isVisible ? 'text-foreground' : 'text-muted-foreground'}`}>
                {c.label}
              </span>
              {!isVisible && (
                <div className="ml-auto w-1 h-1 rounded-full bg-muted-foreground/30" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
