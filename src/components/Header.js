import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext'; // 

function Header(){

  const { user } = useAuth();

    return(
        <header className='header container'>
        <div className="header__left">
          <div className="header__logo">
          <svg width="800px" height="800px" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg" >
<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
<path stroke-miterlimit="40.8" stroke-width="12" d="M30 30h132v132H30z" />
<path stroke-width="12" d="M71 63v64m50-64v64"/>
<path stroke-width="8" d="M71 94h50"/>
</g>
</svg>
          </div>
            <div className="header__name">Script RB</div> 
          <nav className="header__nav">
            <ul className="header__nav-list">
              <Link to="/">
                <li className="header__nav-item">Home</li>
              </Link>
              <Link to="/exploits">
                <li className="header__nav-item">Exploits</li>
              </Link>
              <Link to="/tools">
                <li className="header__nav-item">Tools</li>
              </Link>
            </ul>
          </nav>
        </div>
        <div className="header__right">
          <div className="header__search">
            <input type="text" className="header__search-input" />
            <div className="header__search-icon">
            <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.9536 14.9458L21 21M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
            </div>
          </div>
          
          <div className="header__profile">
            <Link to={user ? "/profile" : "/login"}>
                            <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.71997 11.28 8.71997 9.50998C8.71997 7.69998 10.18 6.22998 12 6.22998C13.81 6.22998 15.28 7.69998 15.28 9.50998C15.27 11.28 13.88 12.72 12.12 12.78Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
            </Link>
              
              </div>
          
          
        </div>
     </header>
    )
}

export default Header;