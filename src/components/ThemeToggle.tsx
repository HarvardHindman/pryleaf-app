"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      style={{
        backgroundColor: theme === 'dark' ? 'var(--clr-info-a20)' : 'var(--clr-surface-a30)'
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Toggle Circle */}
      <span
        className={`inline-block w-5 h-5 rounded-full shadow-lg transform transition-transform duration-200 ease-in-out ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
        }`}
        style={{ backgroundColor: 'var(--clr-surface-a0)' }}
      >
        {/* Icon inside the circle */}
        <span className="flex items-center justify-center w-full h-full">
          {theme === 'dark' ? (
            <Moon className="w-3 h-3" style={{ color: 'var(--clr-primary-a40)' }} />
          ) : (
            <Sun className="w-3 h-3" style={{ color: 'var(--clr-warning-a20)' }} />
          )}
        </span>
      </span>

      {/* Background icons */}
      <span className="absolute left-1.5 top-1.5">
        <Sun 
          className={`w-4 h-4 transition-opacity ${
            theme === 'light' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ color: 'var(--clr-surface-a0)' }}
        />
      </span>
      <span className="absolute right-1.5 top-1.5">
        <Moon 
          className={`w-4 h-4 transition-opacity ${
            theme === 'dark' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ color: 'var(--clr-surface-a0)' }}
        />
      </span>
    </button>
  );
}