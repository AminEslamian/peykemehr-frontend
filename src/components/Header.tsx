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
  const handleNavClick = (sectionId?: string) => {
    if (isAuthenticated) {
      onNavigate('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!sectionId || sectionId === 'top' || sectionId === 'hero') {
      if (currentView === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', '#/');
      } else {
        onNavigate('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (currentView !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <div
          className="brand-clickable"
          onClick={() => handleNavClick('top')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <Logo size={44} showSubtitle={true} />
        </div>

        <nav className="nav-links">
          {isAuthenticated ? (
            <>
              <span
                className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => onNavigate('dashboard')}
                role="button"
                tabIndex={0}
              >
                میز کار من
              </span>
              <span
                className={`nav-link ${currentView === 'survey' ? 'active' : ''}`}
                onClick={() => onNavigate('survey')}
                role="button"
                tabIndex={0}
              >
                نظرسنجی‌های دوره‌ای
              </span>
            </>
          ) : (
            <>
              <span
                className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('top')}
                role="button"
                tabIndex={0}
              >
                صفحه نخست
              </span>
              <span
                className="nav-link"
                onClick={() => handleNavClick('journey')}
                role="button"
                tabIndex={0}
              >
                مسیر همراهی
              </span>
              <span
                className="nav-link"
                onClick={() => handleNavClick('faq')}
                role="button"
                tabIndex={0}
              >
                پرسش‌های متداول
              </span>
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
