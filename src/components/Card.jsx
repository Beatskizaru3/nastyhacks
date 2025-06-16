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
                  <p className="main__card-stat-downloads">{props.downloads}</p>
                  <p className="main__card-stat-date">{props.uploadDate}</p>
                </div>
              </div>
              </div>
            </div>

    )
}

export default Card;