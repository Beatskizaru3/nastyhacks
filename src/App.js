// src/App.js (ВОЗВРАЩАЕМ В НОРМАЛЬНОЕ СОСТОЯНИЕ)
import React, { useEffect } from 'react';
import './index.scss';
import './styles/normalize.scss';
import './styles/media.scss';
import './styles/utility.scss';
import './styles/main.scss';
import './styles/header.scss';
import './styles/stat.scss';
import './styles/footer.scss';

import './styles/cardInfo.scss';

import { Route, Routes, BrowserRouter, Navigate, useLocation } from 'react-router-dom'; 
import Header from './components/Header';
import HomePage from './components/Home';
import CardDetail from './components/CardDetail';
import LoginPage from './pages/loginPage';
import RegisterPage from './pages/registerPage';
import ProfilePage from './components/ProfilePage'; // Теперь это будет "заглушка" ProfilePage
import AdminRoutes from './admin/AdminRoutes';

import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  
  const { user, isLoading } = useAuth();
  console.log('ProtectedRoute: Рендер. user:', user ? user.Username : 'null', 'isLoading:', isLoading);

  if (isLoading) {
    console.log('ProtectedRoute: Загрузка авторизации...');
    return <div>Authorization in progress...</div>;
  }

  if (!user) {
    console.log('ProtectedRoute: Пользователь не авторизован, перенаправление на /login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: Пользователь авторизован, рендер дочерних элементов.');
  return children;
};

function AppRoutes() {
  const location = useLocation();
  console.log('AppRoutes: Рендер. Текущий путь:', location.pathname);

  useEffect(() => {
    console.log('AppRoutes: Монтирование.');
    return () => {
      console.log('AppRoutes: Размонтирование.');
    };
  }, []);

  return (
    <Routes location={location} key={location.pathname}> 
      <Route
        path="/"
        element={<HomePage customLoadButton={"Load More"} customTitle="Recent Scripts" tagId={1} key={location.pathname} />}
      />
      <Route
        path="/exploits"
        element={<HomePage  customLoadButton={"Load More"} customTitle="Recent Exploits" tagId={2} key={location.pathname} />}
      />
      <Route
        path="/tools"
        element={<HomePage customLoadButton={"Load More"} customTitle="Recent Tools" tagId={3} key={location.pathname} />}
      />
      <Route path="/card/:id" element={<CardDetail key={location.pathname} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ВОЗВРАЩАЕМ ProfilePage на его маршрут и с ProtectedRoute */}
      <Route
        path="/profile"
        element={
            <ProtectedRoute>
                <ProfilePage /> 
            </ProtectedRoute>
        }
      />

      <Route path="/admin/*" element={<AdminRoutes />} />
    </Routes>
  );
}

function App() {
  console.log('App: Рендер');
  useEffect(() => {
    console.log('App: Монтирование');
    return () => {
      console.log('App: Размонтирование');
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <AppRoutes /> 
        <footer className="footer container">
          <p className="footer__creds">Made with ❤ by boundless_sv for ScriptRB. All rights reserved.</p>
          <div className="footer__useful">
            <span>
              <a href="#">Privacy Policy</a>
            </span>
            <span>
              <a href="#">Type of Service</a>
            </span>
          </div>
        </footer>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;