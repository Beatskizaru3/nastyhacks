function Header(){
    return(
        <header className='header container'>
        <div className="header__left">
          <div className="header__logo">
            <img src="/svg/logo.svg" alt="" />
          </div>
            <div className="header__name">Script RB</div> 
          <nav className="header__nav">
            <ul className="header__nav-list">
              <li className="header__nav-item">Home</li>
              <li className="header__nav-item">Exploits</li>
              <li className="header__nav-item">Tools</li>
            </ul>
          </nav>
        </div>
        <div className="header__right">
          <div className="header__search">
            <input type="text" className="header__search-input" />
            <div className="header__search-icon">
              <img src="/svg/search.svg" alt="" />
            </div>
          </div>
          <div className="header__profile">
            <img src="/svg/profile.svg" alt="" />
          </div>
        </div>
     </header>
    )
}

export default Header;