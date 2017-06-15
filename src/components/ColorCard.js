import React, {
	Component
} from 'react';
import './colorCard.css';

class ColorCard extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		let cards = this.props.colors.map((color)=>{
			return (
				<div className="card" key={color} style={{background: color}}>
					<div className="value">{color}</div>
				</div>
			);
		});

		return (
			<div className="color-card">
				<div className="title">
					<span className="label">Clustered Colors By K-Means : </span>
				</div>
				<div className="cards-wrap">
					{cards}
				</div>
			</div>
		);
	}
}

export default ColorCard;