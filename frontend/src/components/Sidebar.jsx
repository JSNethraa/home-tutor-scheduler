import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, CheckSquare,
  CreditCard, FileText, GraduationCap,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard',          href: '/',           icon: LayoutDashboard },
    { name: 'Batches & Classes',  href: '/batches',    icon: Users           },
    { name: 'Schedule & Calendar',href: '/schedule',   icon: Calendar        },
    { name: 'Attendance',         href: '/attendance', icon: CheckSquare     },
    { name: 'Fee Installments',   href: '/fees',       icon: CreditCard      },
    { name: 'Progress Reports',   href: '/reports',    icon: FileText        },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-xl">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight text-white">TutorScheduler</h1>
          <p className="text-xs text-slate-400 mt-0.5">Coaching & Home Tutors</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800/80">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Logged in as</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-semibold text-slate-200 truncate">
            {user?.full_name || user?.username}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded border border-blue-700/50">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 text-center">
        College Project Edition v1.0
      </div>
    </aside>
  );
};
