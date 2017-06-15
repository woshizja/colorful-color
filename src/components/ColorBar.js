import React, {
	Component
} from 'react';
import './colorBar.css';

class ColorBar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			colorStart: '',
			colorMiddle: '',
			colorEnd: ''
		};
	}

	render() {
		let bg = '#f0f0f0';
		if (this.props.colorStart && this.props.colorMiddle && this.props.colorEnd) {
			bg = '-webkit-linear-gradient(left,' + this.props.colorStart + ',' + this.props.colorMiddle + ',' + this.props.colorEnd + ')';
		}
		let _style = {
			background: bg
		};

		return (
			<div className="color-bar">
				<div className="title">
					<span className="label">{this.props.label} : </span>
	             <span className="value">{this.props.colorStart}</span>
				</div>
				<div className="color-wrap">
					<div className="color" style={_style}></div>
				</div>
			</div>
		);
	}
}

export default ColorBar;
