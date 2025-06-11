import './index.scss';
import './styles/normalize.scss';
import './styles/media.scss';
import './styles/utility.scss';
import './styles/main.scss';
import './styles/header.scss';
import './styles/stat.scss';

import Header from './components/Header';

function App() {
  return (
  <>
    <Header/>
   <main className='main container'>
      <div className="main__top">
        <h1 className="main__top-title">Found Posts</h1>
        <div className="main__top-filter">Filter<img src='/svg/filter.svg' alt=""/></div>
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
   <section className="stat container">
      <h2 className="stat__title">Our Modest Statistics
      </h2>
      <p className="stat__description">Thank you for being a part of our community and contributing to these figures. Together, we are making an impact!</p>
      <div className="stat__blocks">
        <div className="stat__blocks-dashboard">
          <img src="/svg/download.svg" alt="" className='stat__blocks-img'/>
          <h3 className="stat__blocks-counter">5.5M</h3>
          <p className="stat__blocks-description">Downloads</p>
        </div>
        <div className="stat__blocks-dashboard">
          <img src="/svg/upload.svg" alt="" className='stat__blocks-img'/>
          <h3 className="stat__blocks-counter">2.1K</h3>
          <p className="stat__blocks-description">Uploads</p>
        </div>
        <div className="stat__blocks-dashboard">
          <img src="/svg/users.svg" alt="" className='stat__blocks-img'/>
          <h3 className="stat__blocks-counter">76.2K</h3>
          <p className="stat__blocks-description">Users</p>
        </div>
        <div className="stat__blocks-dashboard">
          <img src="/svg/online.svg" alt="" className='stat__blocks-img'/>
          <h3 className="stat__blocks-counter">79</h3>
          <p className="stat__blocks-description">Online</p>
        </div>
      </div>
      <div className="stat__inTouch">
        <h3>Get in Touch</h3>
        <p>We value your feedback and suggestions. If you have something to say or any questions to ask, don't hesitate to reach out to us! Your input is essential in making our platform better for everyone.</p>
        <button>Send Message</button>
      </div>
   </section>
  </>
    

  );
};

export default App;
