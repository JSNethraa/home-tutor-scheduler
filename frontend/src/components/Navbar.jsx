import React from 'react';
import { GraduationCap } from 'lucide-react';

export const Navbar = () => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <GraduationCap className="w-5 h-5 text-blue-600" />
        <h2 className="text-base font-semibold text-gray-800">
          Home Tutor & Coaching Academy Portal
        </h2>
      </div>
      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
        Demo Mode — No Login Required
      </span>
    </header>
  );
};
