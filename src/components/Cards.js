import '../index.scss';
import '../styles/normalize.scss';
import '../styles/media.scss';
import '../styles/utility.scss';
import '../styles/main.scss';
import '../styles/header.scss';
import '../styles/stat.scss';
import '../styles/footer.scss';

import { useState, useEffect, useRef } from "react";
import { useClickOutside } from '../hooks/useClickOutside';

function Cards() {
    const [isOpen, setOpen] = useState(false);
    const menuRef = useRef(null);
    useClickOutside(menuRef, () => {
    if (isOpen) setTimeout(() => setOpen(false), 50);
  })
    return (
        <main className='main container'>
        <div className="main__top">
          <h1 className="main__top-title">Found Posts</h1>
          <div>
            <button className="main__top-filter-button" onClick={()=>setOpen(!isOpen)}>Filter<svg className="main__top-filter-button-svg"  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12H18M3 6H21M9 18H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          
            <div className={`main__top-filter-body ${isOpen ? "active" : ""}`} ref={menuRef}>
              <ul className='main__top-filter-list'>
                <li className='main__top-filter-item'>Recent</li>
                <li className='main__top-filter-item'>Popular</li>
                <li className='main__top-filter-item'>Older</li>
              </ul>
            </div>
          </div>
        </div>
        <section className="main__cards">
          <div className="main__card">
            <img src="https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp" alt="" className="main__card-img" />
            <div className="main__card-body">
              <div className="main__card-title">Factory RNG</div>
              <p className="main__card-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium, exercitationem explicabo nisi aut laborum veritatis ad velit nihil sunt aliquam inventore a nulla mollitia quae, minus accusamus animi eos et.</p>
              <div className="main__card-additional">
                <button>View</button>
                <div className="main__card-stat">
                  <p className="main__card-stat-downloads">131</p>
                  <p className="main__card-stat-date">09.06.2025</p>
                </div>
              </div>
              </div>
            </div>
            <div className="main__card">
            <img src="https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp" alt="" className="main__card-img" />
            <div className="main__card-body">
              <div className="main__card-title">Factory RNG</div>
              <p className="main__card-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium, exercitationem explicabo nisi aut laborum veritatis ad velit nihil sunt aliquam inventore a nulla mollitia quae, minus accusamus animi eos et.</p>
              <div className="main__card-additional">
                <button>View</button>
                <div className="main__card-stat">
                  <p className="main__card-stat-downloads">131</p>
                  <p className="main__card-stat-date">09.06.2025</p>
                </div>
              </div>
              </div>
            </div>
            <div className="main__card">
            <img src="https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp" alt="" className="main__card-img" />
            <div className="main__card-body">
              <div className="main__card-title">Factory RNG</div>
              <p className="main__card-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium, exercitationem explicabo nisi aut laborum veritatis ad velit nihil sunt aliquam inventore a nulla mollitia quae, minus accusamus animi eos et.</p>
              <div className="main__card-additional">
                <button>View</button>
                <div className="main__card-stat">
                  <p className="main__card-stat-downloads">131</p>
                  <p className="main__card-stat-date">09.06.2025</p>
                </div>
              </div>
              </div>
            </div>
            <div className="main__card">
            <img src="https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp" alt="" className="main__card-img" />
            <div className="main__card-body">
              <div className="main__card-title">Factory RNG</div>
              <p className="main__card-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium, exercitationem explicabo nisi aut laborum veritatis ad velit nihil sunt aliquam inventore a nulla mollitia quae, minus accusamus animi eos et.</p>
              <div className="main__card-additional">
                <button>View</button>
                <div className="main__card-stat">
                  <p className="main__card-stat-downloads">131</p>
                  <p className="main__card-stat-date">09.06.2025</p>
                </div>
              </div>
              </div>
            </div>
            <div className="main__card">
            <img src="https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp" alt="" className="main__card-img" />
            <div className="main__card-body">
              <div className="main__card-title">Factory RNG</div>
              <p className="main__card-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium, exercitationem explicabo nisi aut laborum veritatis ad velit nihil sunt aliquam inventore a nulla mollitia quae, minus accusamus animi eos et.</p>
              <div className="main__card-additional">
                <button>View</button>
                <div className="main__card-stat">
                  <p className="main__card-stat-downloads">131</p>
                  <p className="main__card-stat-date">09.06.2025</p>
                </div>
              </div>
              </div>
            </div>
            <div className="main__card">
            <img src="https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp" alt="" className="main__card-img" />
            <div className="main__card-body">
              <div className="main__card-title">Factory RNG</div>
              <p className="main__card-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium, exercitationem explicabo nisi aut laborum veritatis ad velit nihil sunt aliquam inventore a nulla mollitia quae, minus accusamus animi eos et.</p>
              <div className="main__card-additional">
                <button>View</button>
                <div className="main__card-stat">
                  <p className="main__card-stat-downloads">131</p>
                  <p className="main__card-stat-date">09.06.2025</p>
                </div>
              </div>
              </div>
            </div>
            <div className="main__card">
            <img src="https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp" alt="" className="main__card-img" />
            <div className="main__card-body">
              <div className="main__card-title">Factory RNG</div>
              <p className="main__card-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium, exercitationem explicabo nisi aut laborum veritatis ad velit nihil sunt aliquam inventore a nulla mollitia quae, minus accusamus animi eos et.</p>
              <div className="main__card-additional">
                <button>View</button>
                <div className="main__card-stat">
                  <p className="main__card-stat-downloads">131</p>
                  <p className="main__card-stat-date">09.06.2025</p>
                </div>
              </div>
              </div>
            </div>
            <div className="main__card">
            <img src="https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp" alt="" className="main__card-img" />
            <div className="main__card-body">
              <div className="main__card-title">Factory RNG</div>
              <p className="main__card-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium, exercitationem explicabo nisi aut laborum veritatis ad velit nihil sunt aliquam inventore a nulla mollitia quae, minus accusamus animi eos et.</p>
              <div className="main__card-additional">
                <button>View</button>
                <div className="main__card-stat">
                  <p className="main__card-stat-downloads">131</p>
                  <p className="main__card-stat-date">09.06.2025</p>
                </div>
              </div>
              </div>
            </div>
            <div className="main__card">
            <img src="https://scriptrb.com/cdn-cgi/image/medium-low,format=auto,height=420/https://scriptrb.com/img/uploads/684692b90d5e1_106989035172456074720.webp" alt="" className="main__card-img" />
            <div className="main__card-body">
              <div className="main__card-title">Factory RNG</div>
              <p className="main__card-description">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Praesentium, exercitationem explicabo nisi aut laborum veritatis ad velit nihil sunt aliquam inventore a nulla mollitia quae, minus accusamus animi eos et.</p>
              <div className="main__card-additional">
                <button>View</button>
                <div className="main__card-stat">
                  <p className="main__card-stat-downloads">131</p>
                  <p className="main__card-stat-date">09.06.2025</p>
                </div>
              </div>
              </div>
            </div>
        </section>
        <button className="main__load-button">Load More</button>
     </main>
    );
};

export default Cards;