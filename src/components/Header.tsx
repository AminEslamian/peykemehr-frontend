import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut } from 'lucide-react';
import { getAccessToken, clearAuth } from '../api';
import { Logo } from './Logo';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isAuthenticated: boolean;
  userRole?: 'admin' | 'teacher' | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  isAuthenticated,
  userRole,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState<'top' | 'journey' | 'faq'>('top');
  const isClickScrollingRef = useRef(false);
  const scrollLockTimeoutRef = useRef<number | null>(null);

  // Scroll Spy for Landing Page Sections
  useEffect(() => {
    if (currentView !== 'home') return;

    const handleScroll = () => {
      // Prevent indicator flickering while smooth-scrolling from a click
      if (isClickScrollingRef.current) return;

      const scrollPosition = window.scrollY + 140; // account for 84px header + buffer
      const faqEl = document.getElementById('faq');
      const journeyEl = document.getElementById('journey');

      // Check if user is near bottom of page (where FAQ is) or passed FAQ's top
      const isNearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 80;

      if (faqEl && (scrollPosition >= faqEl.offsetTop || isNearBottom)) {
        setActiveSection('faq');
      } else if (journeyEl && scrollPosition >= journeyEl.offsetTop) {
        setActiveSection('journey');
      } else {
        setActiveSection('top');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check once on mount

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollLockTimeoutRef.current) {
        window.clearTimeout(scrollLockTimeoutRef.current);
      }
    };
  }, [currentView]);

  const handleNavClick = (sectionId?: string) => {
    if (isAuthenticated) {
      onNavigate('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Lock scroll spy during smooth scroll transition
    isClickScrollingRef.current = true;
    if (scrollLockTimeoutRef.current) {
      window.clearTimeout(scrollLockTimeoutRef.current);
    }
    scrollLockTimeoutRef.current = window.setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 900);

    if (!sectionId || sectionId === 'top' || sectionId === 'hero') {
      setActiveSection('top');
      if (currentView === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', '#/');
      } else {
        onNavigate('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setActiveSection(sectionId as 'journey' | 'faq');
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
            currentView === 'admin' || userRole === 'admin' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="admin-status-badge">
                  پنل مدیریت سیستم سفیر مهر
                </span>
              </div>
            ) : (
              <>
                <span
                  className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => {
                    onNavigate('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  role="button"
                  tabIndex={0}
                >
                  میز کار من
                </span>
                <span
                  className={`nav-link ${currentView === 'survey' ? 'active' : ''}`}
                  onClick={() => {
                    onNavigate('survey');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  role="button"
                  tabIndex={0}
                >
                  نظرسنجی‌های دوره‌ای
                </span>
              </>
            )
          ) : (
            <>
              <span
                className={`nav-link ${currentView === 'home' && activeSection === 'top' ? 'active' : ''}`}
                onClick={() => handleNavClick('top')}
                role="button"
                tabIndex={0}
              >
                صفحه نخست
              </span>
              <span
                className={`nav-link ${currentView === 'home' && activeSection === 'journey' ? 'active' : ''}`}
                onClick={() => handleNavClick('journey')}
                role="button"
                tabIndex={0}
              >
                مسیر همراهی
              </span>
              <span
                className={`nav-link ${currentView === 'home' && activeSection === 'faq' ? 'active' : ''}`}
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
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {currentView === 'admin' || userRole === 'admin' ? (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 10px', background: 'var(--color-surface-subtle)', borderRadius: '8px' }}>
                  مدیریت ارشد
                </span>
              ) : null}
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
