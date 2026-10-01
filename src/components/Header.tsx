import React from 'react';
import { User, LogOut, ArrowLeft } from 'lucide-react';
import { getAccessToken, clearAuth } from '../api';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const isAuth = !!getAccessToken();

  const handleLogout = () => {
    clearAuth();
    onNavigate('home');
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand-wrapper" onClick={() => onNavigate('home')}>
          <span className="brand-mark">پ</span>
          <div className="brand-info">
            <b>پیک مهر</b>
            <small>سامانه مبلغین و معلمین</small>
          </div>
        </div>

        <nav className="nav-links">
          <span
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            صفحه نخست
          </span>
          {isAuth ? (
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
          {isAuth ? (
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
                onClick={handleLogout}
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
