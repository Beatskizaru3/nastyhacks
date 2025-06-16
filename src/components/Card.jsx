import { Link } from 'react-router-dom';

function Card(props){
    return(
        <div className="main__card">
            <img src={props.img} alt="" className="main__card-img" />
            <div className="main__card-body">
              <div className="main__card-title">{props.title}</div>
              <p className="main__card-description">{props.description}</p>
              <div className="main__card-additional">
                <Link to={`/card/${props.id}`}>
                    <button>View</button>
                </Link>
                <div className="main__card-stat">
                  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M12 19L6 13M12 19L18 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <p className="main__card-stat-downloads">{props.downloads}</p>
                  <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 7V12L13.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <p className="main__card-stat-date">{props.uploadDate}</p>
                </div>
              </div>
              </div>
            </div>

    )
    
}

export default Card;