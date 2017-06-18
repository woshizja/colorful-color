import React, {
	Component
} from 'react';
import { hslToRgb, rgbToHex } from '../util/utils.js';
import './CanvasBubbleChart.css';

class CanvasBubbleChart extends Component {
	constructor(props) {
		super(props);
		this.state = {
			selectColor: '',
			clickInCircle: false,
      			showSave:false
		};
		this.bubbles = [];
		this.drawBubbles = this.drawBubbles.bind(this);
		this.handleCanvasClick = this.handleCanvasClick.bind(this);
    		this.handleSaveClick = this.handleSaveClick.bind(this);
	}

	componentDidMount() {
		let canvas = this.bubbleChart;
		let pixelRatio = window.devicePixelRatio || 1;
		this.pixelRatio = pixelRatio;
		canvas.width = pixelRatio * parseInt(getComputedStyle(canvas).width);
		canvas.height = pixelRatio * parseInt(getComputedStyle(canvas).height);
		this.oriWidth = canvas.width;
		this.oriHeight = canvas.height;
		this.ctx = canvas.getContext('2d');
		this.circle_r = Math.min(
			canvas.width / 2 - 15*pixelRatio,
			canvas.height / 2 - 15*pixelRatio
		);
		this.iterations = 2;
		this.time = 2000;
		this.density = 0.1;
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.colors.length === 0) {
			this.renderBubble(this.props.colors);
			return;
		}
		if (!this.state.clickInCircle) {
			if(!this.state.showSave){
				return;
			}
			this.renderBubble(this.props.colors);
		}
	}

	processColors(colors) {
		var dataset = [];
		let len = colors.length;
		// console.log("colors: ", len)
		let c_step = len < 360 ? 1 : Math.ceil(len  / 360);
		// console.log("c_step: ", c_step)
		let color;
		let max_weight = colors[0].fre;
		let K = this.circle_r * this.density;
		// console.log("max_weight processColors",max_weight)
		for (let i = 0; i < len;) {
			color = colors[i];
			dataset.push({
				weight: color.fre,
				color: rgbToHex(hslToRgb(color.h, color.s, color.l))
			});
			i += c_step;
		}
		// console.log("bubbles: ", dataset.length)
		return dataset;
	}

	initBubbles(bubbles) {
		let pixelRatio = this.pixelRatio;
		let canvas = this.bubbleChart;
		let w = canvas.width;
		let h = canvas.height;
		let radius = this.circle_r;
		let len = bubbles.length;

		// compute scale factor K for radius
		let max_weight = Math.log2(bubbles[0].weight);
		let K = radius * this.density;
		this.K = K;
		// compute radius again and init object's dataset
		this.bubbles = bubbles.map(ele => {
			// init center for bubble
			let center_x = w / 2 - radius + Math.random() * 2 * radius;
			let center_y = h / 2 - radius + Math.random() * 2 * radius;
			let distance = Math.sqrt(
				Math.pow(w / 2 - center_x, 2) + Math.pow(h / 2 - center_y, 2)
			);
			let r = K * (Math.log(ele.weight) / max_weight);
			r = (r < 1.5 * pixelRatio) ? (1.5 * pixelRatio) : r; // r >= 3
			r = (r>K)?K:r;
			if (distance > radius - r) {
				// move center into circle
				center_x += (w / 2 - center_x) * (distance - radius + r) / distance;
				center_y += (h / 2 - center_y) * (distance - radius + r) / distance;
			}
			return {
				weight: ele.weight,
				color: ele.color,
				radius: r,
				x: center_x,
				y: center_y
			};
		});

		this.max_radius = radius * this.density;
		this.computePosition();
	}

	renderBubble(colors) {
		if (colors.length === 0) {
			this.ctx.clearRect(0, 0, this.bubbleChart.width, this.bubbleChart.height);
			return;
		}
		let bubbles = this.processColors(colors);
		if (bubbles && bubbles.length > 0) {
			this.initBubbles(bubbles);
		}
		// draw bubbles
		this.start_time = +new Date();
		this.speed = this.max_radius / this.time;
		this.drawBubbles();
	}

	computePosition() {
		let iterations = this.iterations;
		let iteration = 0;
		let bubbles = this.bubbles;
		let len = bubbles.length;

		while (iteration < iterations) {
			iteration++;
			let l_1 = len;
			while (l_1--) {
				// duff's device save much time, but almost ineffective when two duff Nested
				this.traverseBubbles(bubbles[l_1]);
			}
		}
	}

	traverseBubbles(bubble1) {
		let bubbles = this.bubbles;
		let len = bubbles.length;
		let count = (len / 8) ^ 0;
		let start = len % 8;
		while (start--) {
			this.divideBubbles(bubble1, bubbles[start]);
		}
		while (count--) {
			this.divideBubbles(bubble1, bubbles[--len]);
			this.divideBubbles(bubble1, bubbles[--len]);
			this.divideBubbles(bubble1, bubbles[--len]);
			this.divideBubbles(bubble1, bubbles[--len]);
			this.divideBubbles(bubble1, bubbles[--len]);
			this.divideBubbles(bubble1, bubbles[--len]);
			this.divideBubbles(bubble1, bubbles[--len]);
			this.divideBubbles(bubble1, bubbles[--len]);
		}
	}

	divideBubbles(bubble1, bubble2) {
		if (
			bubble1.color === bubble2.color &&
			bubble1.radius === bubble2.radius &&
			Math.abs(bubble1.x - bubble2.x) < 0.001
		) {
			return;
		}
		let diff = this.collisionCheck(bubble1, bubble2);
		if (diff > 0) {
			return;
		}
		diff = Math.abs(diff);
		let cta = Math.atan(
			Math.abs(bubble1.y - bubble2.y) / Math.abs(bubble1.x - bubble2.x)
		);
		let x_diff = diff * Math.cos(cta) + 0.2;
		let y_diff = diff * Math.sin(cta) + 0.2;

		// pos analyze
		if (bubble2.x >= bubble1.x && bubble2.y >= bubble1.y) {
			// 4 quadrant
			bubble2.x += x_diff;
			bubble2.y += y_diff;
		} else if (bubble2.x <= bubble1.x && bubble2.y >= bubble1.y) {
			// 3 quadrant
			bubble2.x -= x_diff;
			bubble2.y += y_diff;
		} else if (bubble2.x <= bubble1.x && bubble2.y <= bubble1.y) {
			// 2 quadrant
			bubble2.x -= x_diff;
			bubble2.y -= y_diff;
		} else if (bubble2.x >= bubble1.x && bubble2.y <= bubble1.y) {
			// 1 quadrant
			bubble2.x += x_diff;
			bubble2.y -= y_diff;
		}
	}

	collisionCheck(bubble1, bubble2) {
		var x = Math.abs(bubble1.x - bubble2.x);
		var y = Math.abs(bubble1.y - bubble2.y);
		var r = bubble1.radius + bubble2.radius;
		return Math.sqrt(x * x + y * y) - r;
	}

	drawBubbles() {
		let now = +new Date();
		let scale = (now - this.start_time) * this.speed;

		let bubbles = this.bubbles;
		let ctx = this.ctx;
		let len = bubbles.length;
		ctx.clearRect(0, 0, this.bubbleChart.width, this.bubbleChart.height);

		let count = (len / 8) ^ 0;
		let start = len % 8;
		while (start--) {
			this.drawBubble(bubbles[start], scale);
		}
		while (count--) {
			this.drawBubble(bubbles[--len], scale);
			this.drawBubble(bubbles[--len], scale);
			this.drawBubble(bubbles[--len], scale);
			this.drawBubble(bubbles[--len], scale);
			this.drawBubble(bubbles[--len], scale);
			this.drawBubble(bubbles[--len], scale);
			this.drawBubble(bubbles[--len], scale);
			this.drawBubble(bubbles[--len], scale);
		}

		if (now < this.start_time + this.time) {
			window.requestAnimationFrame(this.drawBubbles);
		} else if (this.speed !== 0) {
			this.speed = 0;
			window.requestAnimationFrame(this.drawBubbles);
		}
	}

	drawBubble(bubble, scale) {
		let ctx = this.ctx;
		let radius = bubble.radius;
		ctx.fillStyle = bubble.color;
		ctx.beginPath();
		if (scale < radius && this.speed !== 0) {
			ctx.arc(bubble.x, bubble.y, scale, 0, 2 * Math.PI);
		} else {
			let damp = this.speed === 0 ? 0 : (scale - radius) / this.max_radius;
			let spring = 2 * Math.exp(-8 * damp) * Math.sin(2 * 2 * Math.PI * damp);
			ctx.arc(bubble.x, bubble.y, radius + spring, 0, 2 * Math.PI);
		}
		ctx.fill();
	}

	windowTocanvas(canvas, x, y) {
		let bbox = canvas.getBoundingClientRect();
		return {
			x: x - bbox.left,
			y: y - bbox.top
		};
	}

	handleCanvasClick(e) {
		let loc = this.windowTocanvas(this.bubbleChart, e.clientX, e.clientY);
		let cx = this.bubbleChart.width / 2;
		let cy = this.bubbleChart.height / 2;
		let x = loc.x * this.pixelRatio;
		let y = loc.y * this.pixelRatio;
		let color = '';
		let clickInCircle = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) < this.circle_r;
		let bubbles = this.bubbles;
		let len = bubbles.length;
		while (len--) {
			let bubble = bubbles[len];
			let dis = Math.sqrt((x - bubble.x) * (x - bubble.x) + (y - bubble.y) * (y - bubble.y));
			if (dis < bubble.radius) {
				color = bubble.color;
				break;
			}
		}
		if (clickInCircle) {
			this.setState({
				selectColor: color ? color : this.state.selectColor,
				clickInCircle: clickInCircle
			});
		} else {
			this.setState({
				selectColor: '',
				clickInCircle: clickInCircle
			});
			this.setState({
			      showSave: !this.state.showSave
			});
		    	if(this.timer){
		        	clearTimeout(this.timer);
		    	}
		    	this.timer = setTimeout(()=>{
		      		this.setState({
		        		showSave: false
		      		});
		   	},2300);
		}
	}

	handleSaveClick(){
	    let canvas = this.bubbleChart;
	    let img = new Image();
    	    img.src = canvas.toDataURL("image/png");
	    let w = window.open('about:blank', 'image from canvas');
	    w.document.body.appendChild(img);
	}

	render() {
		let saveWrapClass = this.state.showSave ? 'show' : '';
    		saveWrapClass += " save-wrap";
		return (
			<div className="bubble-chart">
				<div className="title">
					<span className="label">More Colors In Bubble Chart : </span>
				</div>
				<canvas  ref={(canvas) => { this.bubbleChart = canvas; }} onClick={this.handleCanvasClick}></canvas>
				<div className="select-wrap">
					<div className="color" style={{background: this.state.selectColor}}>{this.state.selectColor}</div>
				</div>
				<div className={saveWrapClass}>
			        <span className="save" onClick={this.handleSaveClick}>SAVE</span>
			      </div>
			</div>
		);
	}
}

export default CanvasBubbleChart;
