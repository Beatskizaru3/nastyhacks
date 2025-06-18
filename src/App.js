import './index.scss';
import './styles/normalize.scss';
import './styles/media.scss';
import './styles/utility.scss';
import './styles/main.scss';
import './styles/header.scss';
import './styles/stat.scss';
import './styles/footer.scss';

import './styles/cardInfo.scss';

import { Route, Routes, BrowserRouter, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './components/Home'; // Убедитесь, что это Home, а не HomePage в пути
import CardDetail from './components/CardDetail';
import LoginPage from './pages/loginPage';
import RegisterPage from './pages/registerPage';
import ProfilePage from './components/ProfilePage';
import AdminRoutes from './admin/AdminRoutes';

import { AuthProvider, useAuth } from './context/AuthContext';

// Обертка для защиты маршрутов
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Authorization in progress...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Header />
          <Routes>
            {/* HomePage теперь будет загружать данные сама */}
            <Route
              path="/"
              element={
                <HomePage
                  isCardDetailPage={false}
                  customLoadButton="View More"
                  customTitle="Recent Scripts"
                  // Больше НЕ передаем cardsData! HomePage будет запрашивать их сама.
                  // При желании, можно добавить prop 'tagId' для фильтрации, если HomePage будет его использовать
                  // tagId={1} // Пример: если 1 это ID для скриптов
                />
              }
            />

            <Route
              path="/exploits"
              element={
                <HomePage
                  isCardDetailPage={false}
                  customLoadButton="View More"
                  customTitle="Recent Exploits"
                  // tagId={2} // Пример: если 2 это ID для эксплоитов
                />
              }
            />

            <Route
              path="/tools"
              element={
                <HomePage
                  isCardDetailPage={false}
                  customLoadButton="View More"
                  customTitle="Recent Tools"
                  // tagId={3} // Пример: если 3 это ID для инструментов
                />
              }
            />

            {/* CardDetail также загружает данные сам по id */}
            <Route path="/card/:id" element={<CardDetail />} />

            <Route path="/login" element={<LoginPage />} />

            <Route path="/register" element={<RegisterPage />} />

            {/* Активируем ProtectedRoute для страницы профиля */}
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
    </>
  );
}

export default App;