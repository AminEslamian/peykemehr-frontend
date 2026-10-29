import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  LogOut,
  Eye,
  Shield,
  Menu,
  X,
  Home,
  LayoutDashboard,
  ClipboardList,
  Bell,
  Sparkles,
} from 'lucide-react';
import { getAccessToken, clearAuth, getTeacherInfo } from '../api';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isClickScrollingRef = useRef(false);
  const scrollLockTimeoutRef = useRef<number | null>(null);
  const teacher = isAuthenticated ? getTeacherInfo() : null;

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

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
    setMobileMenuOpen(false);

    if (isAuthenticated) {
      if (userRole === 'admin') {
        onNavigate('admin');
      } else {
        onNavigate('dashboard');
      }
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

  const handleDrawerNavigate = (view: string, sectionId?: string) => {
    setMobileMenuOpen(false);
    if (sectionId) {
      handleNavClick(sectionId);
    } else {
      onNavigate(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="site-header">
      <div className="header-inner">
        <div
          className="brand-clickable"
          onClick={() => handleNavClick('top')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <Logo size={42} showSubtitle={true} />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links">
          {isAuthenticated ? (
            currentView === 'admin' ? (
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
                  className={`nav-link ${currentView === 'profile' ? 'active' : ''}`}
                  onClick={() => {
                    onNavigate('profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  role="button"
                  tabIndex={0}
                >
                  پروفایل من
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

        {/* Header Right Actions */}
        <div className="header-actions-group">
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {userRole === 'admin' && (
                currentView === 'admin' ? (
                  <button
                    type="button"
                    className="btn-astra btn-astra-outline btn-astra-sm header-action-btn"
                    onClick={() => {
                      onNavigate('dashboard');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    title="مشاهده سامانه از نگاه معلمان و مربیان"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={15} />
                    <span className="header-btn-text">نمای معلمان</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-astra btn-astra-primary btn-astra-sm header-action-btn"
                    onClick={() => {
                      onNavigate('admin');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    title="بازگشت به پنل مدیریت ارشد"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Shield size={15} />
                    <span className="header-btn-text">پنل مدیریت</span>
                  </button>
                )
              )}
              <button
                type="button"
                className="btn-astra btn-astra-danger btn-astra-sm header-logout-btn"
                onClick={onLogout}
                title="خروج از حساب کاربری"
              >
                <LogOut size={15} />
                <span className="header-btn-text">خروج</span>
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

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="منوی ناوبری"
            aria-expanded={mobileMenuOpen}
            title="منوی ناوبری"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Off-Canvas Drawer Portal */}
    {typeof document !== 'undefined' &&
      createPortal(
        <>
          {/* Mobile Off-Canvas Drawer Overlay */}
          <div
            className={`mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Off-Canvas Drawer */}
          <aside
            className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
            aria-label="منوی ناوبری موبایل"
            aria-hidden={!mobileMenuOpen}
          >
            <div className="mobile-drawer-header">
              <div
                className="brand-clickable"
                onClick={() => {
                  if (isAuthenticated) {
                    handleDrawerNavigate(userRole === 'admin' ? 'admin' : 'dashboard');
                  } else {
                    handleDrawerNavigate('home', 'top');
                  }
                }}
              >
                <Logo size={36} showSubtitle={false} />
              </div>
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="بستن منو"
              >
                <X size={20} />
              </button>
            </div>

            {isAuthenticated && teacher && (
              <div className="mobile-drawer-user-card">
                <div className="mobile-drawer-avatar">
                  {teacher.first_name?.[0] || <User size={18} />}
                </div>
                <div className="mobile-drawer-user-info">
                  <span className="mobile-drawer-user-name">
                    {[teacher.first_name, teacher.last_name].filter(Boolean).join(' ') || 'همکار گرامی'}
                  </span>
                  <span className="mobile-drawer-user-sub">
                    {teacher.school || teacher.phone_number || 'معلم و مربی طرح زیتون'}
                  </span>
                </div>
              </div>
            )}

            <nav className="mobile-drawer-body">
              {isAuthenticated ? (
                userRole === 'admin' ? (
                  <>
                    <button
                      type="button"
                      className={`mobile-drawer-link ${currentView === 'admin' ? 'active' : ''}`}
                      onClick={() => handleDrawerNavigate('admin')}
                    >
                      <Shield size={18} />
                      <span>پنل مدیریت ارشد</span>
                    </button>
                    <button
                      type="button"
                      className={`mobile-drawer-link ${currentView === 'dashboard' ? 'active' : ''}`}
                      onClick={() => handleDrawerNavigate('dashboard')}
                    >
                      <Eye size={18} />
                      <span>نمای معلمان (میز کار)</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`mobile-drawer-link ${currentView === 'dashboard' ? 'active' : ''}`}
                      onClick={() => handleDrawerNavigate('dashboard')}
                    >
                      <LayoutDashboard size={18} />
                      <span>میز کار من</span>
                    </button>
                    <button
                      type="button"
                      className={`mobile-drawer-link ${currentView === 'profile' ? 'active' : ''}`}
                      onClick={() => handleDrawerNavigate('profile')}
                    >
                      <User size={18} />
                      <span>پروفایل و مشخصات من</span>
                    </button>
                    <button
                      type="button"
                      className={`mobile-drawer-link ${currentView === 'survey' ? 'active' : ''}`}
                      onClick={() => handleDrawerNavigate('survey')}
                    >
                      <ClipboardList size={18} />
                      <span>نظرسنجی‌های پویش</span>
                    </button>
                    <button
                      type="button"
                      className={`mobile-drawer-link ${currentView === 'blog' ? 'active' : ''}`}
                      onClick={() => handleDrawerNavigate('blog')}
                    >
                      <Bell size={18} />
                      <span>اطلاعیه‌ها و اخبار دبیرخانه</span>
                    </button>
                  </>
                )
              ) : (
                <>
                  <button
                    type="button"
                    className={`mobile-drawer-link ${currentView === 'home' && activeSection === 'top' ? 'active' : ''}`}
                    onClick={() => handleDrawerNavigate('home', 'top')}
                  >
                    <Home size={18} />
                    <span>صفحه نخست</span>
                  </button>
                  <button
                    type="button"
                    className={`mobile-drawer-link ${currentView === 'home' && activeSection === 'journey' ? 'active' : ''}`}
                    onClick={() => handleDrawerNavigate('home', 'journey')}
                  >
                    <Sparkles size={18} />
                    <span>مسیر همراهی</span>
                  </button>
                  <button
                    type="button"
                    className={`mobile-drawer-link ${currentView === 'home' && activeSection === 'faq' ? 'active' : ''}`}
                    onClick={() => handleDrawerNavigate('home', 'faq')}
                  >
                    <ClipboardList size={18} />
                    <span>پرسش‌های متداول</span>
                  </button>
                </>
              )}
            </nav>

            <div className="mobile-drawer-footer">
              {isAuthenticated ? (
                <button
                  type="button"
                  className="btn-astra btn-astra-danger btn-mobile-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={16} />
                  خروج از حساب کاربری
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-astra btn-astra-primary btn-mobile-full"
                    onClick={() => handleDrawerNavigate('login')}
                  >
                    <User size={16} />
                    ورود به سامانه
                  </button>
                  <button
                    type="button"
                    className="btn-astra btn-astra-outline btn-mobile-full"
                    onClick={() => handleDrawerNavigate('register')}
                  >
                    ثبت‌نام در سامانه
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>,
        document.body
      )}
    </>
  );
};
