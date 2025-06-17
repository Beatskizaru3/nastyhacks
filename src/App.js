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
import HomePage from './components/Home';
import CardDetail from './components/CardDetail';
import LoginPage from './pages/loginPage';
import RegisterPage from './pages/registerPage';
import ProfilePage from './components/ProfilePage';

import { mockCards, mockTools, mockExploits } from './mockData'; // Убедитесь, что путь правильный

import { AuthProvider, useAuth } from './context/AuthContext';


//пишем обертку для защиты
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return(<div>Authorization in proccess</div>)
  }

  if (!user){
    return <Navigate to="/login" replace />
  }

  return children;
};

function App() {


  return (
  <>
   <BrowserRouter>
    <AuthProvider>
      <Header/>
      <Routes>
        <Route path='/' element={<HomePage
          isCardDetailPage={false}
          customLoadButton={"View More"}
          customTitle={"Recent Scripts"}
          cardsData={mockCards}
          />} />
        
        <Route path='/exploits' element={<HomePage
          isCardDetailPage={false}
          customLoadButton={"View More"}
          customTitle={"Recent Exploits"}
          cardsData={mockExploits}
        />} /> 

        <Route path='/tools' element={<HomePage
          isCardDetailPage={false}
          customLoadButton={"View More"}
          customTitle={"Recent Tools"}
          cardsData={mockTools}
        />} />

        <Route path='/card/:id' element={<CardDetail
          allScripts={mockCards}
          allExploits={mockExploits}
          allTools={mockTools}
        />} />

        <Route path='/login' element={<LoginPage
        // login={}
        // password={}
        />}/>

        <Route path='/register' element={<RegisterPage
        // login={}
        // password={}
        />}/>

<Route path='/profile' element={
          
            <ProfilePage/>
          
        }/>

        {/* <Route path='/profile' element={
          <ProtectedRoute>
            <ProfilePage/>
          </ProtectedRoute>
        }/> */}
      </Routes>
        <footer className="footer container">
          <p className="footer__creds">Made with ❤ by boundless_sv for ScriptRB. All rights reserved.</p>
          <div className="footer__useful">
            <span><a href="#">Privacy Policy</a></span>
            <span><a href="#">Type of Service</a></span>
          </div>
      </footer>
    </AuthProvider>
   </BrowserRouter>
   
   </>
    

  );
};
   
export default App;
