import React from 'react';
import { User, LogOut } from 'lucide-react';
import { getAccessToken, clearAuth } from '../api';
import { Logo } from './Logo';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  isAuthenticated,
  onLogout,
}) => {

  return (
    <header className="site-header">
      <div className="header-inner">
        <div
          className="brand-clickable"
          onClick={() => onNavigate('home')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <Logo size={44} showSubtitle={true} />
        </div>

        <nav className="nav-links">
          <span
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            صفحه نخست
          </span>
          {isAuthenticated ? (
            <>
              <span
                className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => onNavigate('dashboard')}
              >
                ثبت گزارش
              </span>
              <span
                className={`nav-link ${currentView === 'survey' ? 'active' : ''}`}
                onClick={() => onNavigate('survey')}
              >
                نظرسنجی‌ها
              </span>
            </>
          ) : (
            <>
              <a href="#journey" className="nav-link">
                مسیر همراهی
              </a>
              <a href="#faq" className="nav-link">
                پرسش‌های متداول
              </a>
            </>
          )}
        </nav>

        <div>
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-astra btn-astra-outline btn-astra-sm"
                onClick={() => onNavigate('dashboard')}
              >
                میز کار من
              </button>
              <button
                type="button"
                className="btn-astra btn-astra-danger btn-astra-sm"
                onClick={onLogout}
              >
                <LogOut size={15} />
                خروج
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-astra btn-astra-primary btn-astra-sm"
              onClick={() => onNavigate('login')}
            >
              <User size={16} />
              ورود به سامانه
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
