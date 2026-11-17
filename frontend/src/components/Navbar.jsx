import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCircle } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
      <div>
        <h2 className="text-base font-semibold text-gray-800">
          Home Tutor & Coaching Academy Portal
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserCircle className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-800">{user?.full_name || user?.username}</span>
          <span className="text-xs text-gray-400">({user?.email})</span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition font-medium border border-red-100"
          title="Sign out of system"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
