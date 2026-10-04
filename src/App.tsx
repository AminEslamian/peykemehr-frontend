import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { SurveyView } from './views/SurveyView';
import { getAccessToken, clearAuth } from './api';

export type ViewType = 'home' | 'login' | 'register' | 'dashboard' | 'survey';

export const App: React.FC = () => {
  const getHashView = (): ViewType => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash === 'login') return 'login';
    if (hash === 'register') return 'register';
    if (hash === 'dashboard') return 'dashboard';
    if (hash === 'survey') return 'survey';
    return 'home';
  };

  const [currentView, setCurrentView] = useState<ViewType>(getHashView());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAccessToken());

  const navigateTo = (view: string) => {
    window.location.hash = `#/${view}`;
  };

  const handleLogout = () => {
    clearAuth();
    setIsAuthenticated(false);
    setCurrentView('home');
    window.location.hash = '#/';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    navigateTo('dashboard');
  };

  useEffect(() => {
    const handleHashChange = () => {
      const target = getHashView();
      const token = getAccessToken();
      const authed = !!token;
      setIsAuthenticated(authed);

      // Protected route guard: redirect unauthenticated users to login
      if ((target === 'dashboard' || target === 'survey') && !authed) {
        window.location.hash = '#/login';
        return;
      }

      // Authenticated route guard: logged-in educators see dashboard hub instead of landing page / auth pages
      if (authed && (target === 'home' || target === 'login' || target === 'register')) {
        window.location.hash = '#/dashboard';
        return;
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
      </main>

      <Footer onNavigate={navigateTo} />
    </div>
  );
};
