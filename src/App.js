import './index.scss';
import './styles/normalize.scss';
import './styles/media.scss';
import './styles/utility.scss';
import './styles/main.scss';
import './styles/header.scss';
import './styles/stat.scss';
import './styles/footer.scss';

import './styles/cardInfo.scss';

import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './components/Home';
import CardDetail from './components/CardDetail';

function App() {
  return (
  <>
   <BrowserRouter>
   <Header/>
    <Routes>
      <Route path='/' element={<HomePage/>} />
      <Route path='/card/:id' element={<CardDetail/>}/>
    </Routes>
   </BrowserRouter>
   <footer className="footer container">
    <p className="footer__creds">Made with ❤ by boundless_sv for ScriptRB. All rights reserved.</p>
    <div className="footer__useful">
      <span><a href="#">Privacy Policy</a></span>
      <span><a href="#">Type of Service</a></span>
    </div>
   </footer>
   </>
    

  );
};
   
export default App;
