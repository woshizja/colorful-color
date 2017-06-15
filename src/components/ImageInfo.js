import React, {
	Component
} from 'react';
import './imageInfo.css';

class ImageInfo extends Component {
	constructor(props) {
		super(props);
		this.state = {
		};
	}

	render(){
		return (
			<div className="info-wrap">
				<div className="info-bar">
					Found about  <span className="info">{this.props.processInfo.colors}</span> colors in your image.
				</div>
				<div className="info-bar">
					Color Census Time is <span className="info">{this.props.processInfo.censusTime}</span> ms.
				</div>
				<div className="info-bar">
					K-Means iterated <span className="info">{this.props.processInfo.kmeansIteration}</span> times with cost of <span className="info">{this.props.processInfo.kmeansTime}</span>ms.
				</div>
				<div className="info-bar">
					The top5 colors account for <span className="info">{this.props.processInfo.top5Count.toFixed(1)}%</span> of total.
				</div>
			</div>
		);
	}
}

export default ImageInfo;