import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { SurveyView } from './views/SurveyView';
import { getAccessToken } from './api';

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

  const navigateTo = (view: string) => {
    window.location.hash = `#/${view}`;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const target = getHashView();
      const token = getAccessToken();

      // Protected route guard
      if ((target === 'dashboard' || target === 'survey') && !token) {
        window.location.hash = '#/login';
        return;
      }

      // Guest only route guard (redirect logged-in users away from login/register)
      if ((target === 'login' || target === 'register') && token) {
        window.location.hash = '#/dashboard';
        return;
      }

      setCurrentView(target);
      window.scrollTo(0, 0);
    };

    // Initial check on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header currentView={currentView} onNavigate={navigateTo} />

      <main style={{ flex: 1 }}>
        {currentView === 'home' && <HomeView onNavigate={navigateTo} />}

        {currentView === 'login' && (
          <AuthView
            initialMode="login"
            onDone={() => navigateTo('dashboard')}
            onSwitchMode={(mode) => navigateTo(mode)}
          />
        )}

        {currentView === 'register' && (
          <AuthView
            initialMode="register"
            onDone={() => navigateTo('dashboard')}
            onSwitchMode={(mode) => navigateTo(mode)}
          />
        )}

        {currentView === 'dashboard' && <DashboardView onNavigate={navigateTo} />}

        {currentView === 'survey' && <SurveyView onNavigate={navigateTo} />}
      </main>

      <Footer />
    </div>
  );
};
