import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { SurveyView } from './views/SurveyView';
import { AdminView } from './views/AdminView';
import { getAccessToken, clearAuth, getUserRole } from './api';

export type ViewType = 'home' | 'login' | 'register' | 'dashboard' | 'survey' | 'admin';

export const App: React.FC = () => {
  const getHashView = (): ViewType => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash === 'login') return 'login';
    if (hash === 'register') return 'register';
    if (hash === 'dashboard') return 'dashboard';
    if (hash === 'survey') return 'survey';
    if (hash === 'admin') return 'admin';
    return 'home';
  };

  const [currentView, setCurrentView] = useState<ViewType>(getHashView());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAccessToken());
  const [userRole, setUserRoleState] = useState<'admin' | 'teacher' | null>(getUserRole());

  const navigateTo = (view: string) => {
    window.location.hash = `#/${view}`;
  };

  const handleLogout = () => {
    clearAuth();
    setIsAuthenticated(false);
    setUserRoleState(null);
    setCurrentView('home');
    window.location.hash = '#/';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (role?: 'admin' | 'teacher') => {
    setIsAuthenticated(true);
    const resolved = role || getUserRole();
    setUserRoleState(resolved);
    if (resolved === 'admin') {
      navigateTo('admin');
    } else {
      navigateTo('dashboard');
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const target = getHashView();
      const token = getAccessToken();
      const authed = !!token;
      const role = getUserRole();
      setIsAuthenticated(authed);
      setUserRoleState(role);

      // Protected route guard: redirect unauthenticated users to login
      if ((target === 'dashboard' || target === 'survey' || target === 'admin') && !authed) {
        window.location.hash = '#/login';
        return;
      }

      // Role isolation: Admin users must NEVER see educator pages (dashboard / survey) or landing/login
      if (authed && role === 'admin') {
        if (target === 'dashboard' || target === 'survey' || target === 'home' || target === 'login' || target === 'register') {
          window.location.hash = '#/admin';
          return;
        }
      }

      // Role isolation: Standard teachers must NEVER enter admin panel
      if (authed && role === 'teacher') {
        if (target === 'admin') {
          window.location.hash = '#/dashboard';
          return;
        }
        if (target === 'home' || target === 'login' || target === 'register') {
          window.location.hash = '#/dashboard';
          return;
        }
      }

      setCurrentView(target);

      const rawHash = window.location.hash.replace(/^#\/?/, '');
      if (target === 'home' && (rawHash === 'journey' || rawHash === 'faq')) {
        setTimeout(() => {
          const el = document.getElementById(rawHash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        window.scrollTo(0, 0);
      }
    };

    // Initial check on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        currentView={currentView}
        onNavigate={navigateTo}
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'home' && <HomeView onNavigate={navigateTo} />}

        {currentView === 'login' && (
          <AuthView
            initialMode="login"
            onDone={handleAuthSuccess}
            onSwitchMode={(mode) => navigateTo(mode)}
          />
        )}

        {currentView === 'register' && (
          <AuthView
            initialMode="register"
            onDone={handleAuthSuccess}
            onSwitchMode={(mode) => navigateTo(mode)}
          />
        )}

        {currentView === 'dashboard' && <DashboardView onNavigate={navigateTo} />}

        {currentView === 'survey' && <SurveyView onNavigate={navigateTo} />}

        {currentView === 'admin' && <AdminView onNavigate={navigateTo} />}
      </main>

      <Footer onNavigate={navigateTo} />
    </div>
  );
};
