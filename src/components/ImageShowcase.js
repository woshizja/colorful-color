import React, { Component } from 'react';
import './imageShowcase.css';

class ImageShowcase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bgC: "",
      K: 6,
      isMounted: false,
      clusterColors:[]
    };
    this.isLoaded = false;
    this.handleOpenClick = this.handleOpenClick.bind(this);
    this.handleClearClick = this.handleClearClick.bind(this);
    this.handleKInput = this.handleKInput.bind(this);
    this.handleCensusClick = this.handleCensusClick.bind(this);
    this.readFile = this.readFile.bind(this);
    this.drawColor = this.drawColor.bind(this);
  }

  componentDidMount(){
    let pixelRatio = window.devicePixelRatio || 1;
    this.pixelRatio = pixelRatio;
    let canvas = this.canvasShowcase;
    canvas.width =  pixelRatio * parseInt(getComputedStyle(canvas).width);
    canvas.height = pixelRatio * parseInt(getComputedStyle(canvas).height);
    this.oriWidth = canvas.width;
    this.oriHeight = canvas.height;
    this.ctx = canvas.getContext('2d');
    setTimeout(()=>{
      this.setState({isMounted:true});
    }, 500);
  }

  componentDidUpdate(prevProps, prevState){
    if(prevState.K === this.state.K){
      this.drawPalette();
    }
  }

  handleOpenClick() {
    this.imgInput.click();
  }

  handleClearClick(){
    this.isLoaded = false;
    this.resetShowcase();
    this.props.resetApp();
  }

  handleKInput(e){
    let val = e.target.value;
    val = val<3?3:(val>20?20:val);
    this.setState({K: val});
  }

  handleCensusClick(){
    if(!this.isLoaded){
      return;
    }
    let canvas = this.canvasShowcase;
    this.props.censusColors(this.ctx, this.state.K, canvas.width, canvas.height, this.isHorizontal, this.drawColor);
    this.props.setScoreLayer(true);
  }

  drawColor(main_color, cluster_colors){
      this.setState({
         bgC: main_color,
         clusterColors: cluster_colors
      });
  }

  readFile(){
      let file = this.imgInput.files[0];
      if(!file){
        return false;
      }
      if (!/image\/\w+/.test(file.type)) {
        console.log("image needed!");
        return false;
      }
      let reader = new FileReader();
      reader.readAsDataURL(file); //转化成base64数据类型
      let that = this;
      reader.onload = function() {
        that.drawToCanvas(this.result);
      }
  }

  resetShowcase(){
     let canvas = this.canvasShowcase;
     canvas.width = this.oriWidth;
     canvas.style.width = this.oriWidth + "px";
     canvas.height = this.oriHeight;
     canvas.style.height = this.oriHeight + "px";
     this.setState({
      bgC: "",
      clusterColors: []
     });
  }

  drawToCanvas(imgData){
    this.handleClearClick();
    let pixelRatio = this.pixelRatio;
    this.isLoaded = true;
    let canvas = this.canvasShowcase;
    let c_w = canvas.width;
    let c_h = canvas.height;
    let ctx = this.ctx;
    let img = new Image();
    img.src = imgData;
    img.onload = () => {
      ctx.clearRect(0, 0, c_w, c_h);
      console.log(c_w, c_h)
      console.log(img.width, img.height)
      let _w = 0;
      let _h = 0;
      if(img.width<img.height){
        _w = 100*pixelRatio;
        this.isHorizontal = false;
      }else{
        _h = 100*pixelRatio;
        this.isHorizontal = true;
      }
      let img_w = img.width > (c_w-_w)/pixelRatio ? (c_w-_w)/pixelRatio : img.width;
      let img_h = img.height > (c_h-_h)/pixelRatio ? (c_h-_h)/pixelRatio : img.height;
      let scale = (img_w / img.width < img_h / img.height) ? (img_w / img.width) : (img_h / img.height);
      img_w = img.width * scale;
      img_h = img.height * scale;
      console.log(img_w,img_h)
      canvas.style.width = img_w + _w + "px";
      canvas.style.height = img_h + _h + "px";
      canvas.width = img_w + _w;
      canvas.height = img_h + _h;
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img_w, img_h);
    };
  }

  drawPalette(){
    let pixelRatio = this.pixelRatio;
    let canvas = this.canvasShowcase;
    let c_w = canvas.width;
    let c_h = canvas.height;
    let ctx = this.ctx;
    let K = this.state.K;
    let len = this.isHorizontal ? c_w : c_h;
    let interval = len*(K<10 ? 0.02 : 0.01);
    interval *= pixelRatio;
    let p = (len-(K-1)*interval) / K;
    let colors = this.state.clusterColors;
    if(colors.length===0){
      return;
    }
    if(this.isHorizontal){
      ctx.clearRect(0, c_h - 90*pixelRatio, c_w, 90*pixelRatio);
    }else{
      ctx.clearRect(c_w - 90*pixelRatio, 0, 90*pixelRatio, c_h);
    }
    for(let i=0;i<K;i++){
      ctx.fillStyle = colors[i];
      if(this.isHorizontal){
        ctx.fillRect((p + interval)*i ,c_h - 90*pixelRatio,p,90*pixelRatio);
      }else{
        ctx.fillRect(c_w - 90*pixelRatio, (p + interval)*i, 90*pixelRatio, p);
      }
    }
  }

  render() {
    let showcaseClass = this.state.isMounted ? 'mounted' : '';
    showcaseClass += " image-showcase";
    let showcaseWrapClass = this.state.bgC ? 'censused' : '';
    showcaseWrapClass += " showcase-wrap";
    return (
      <div className={showcaseClass}>
        <div className="head"><b>Color Census</b></div>
        <div className={showcaseWrapClass} style={{background:this.state.bgC}}>
          <canvas className="showcase" ref={(canvas) => { this.canvasShowcase = canvas; }}></canvas>
        </div>
        <input className="img-input" type="file" multiple="multiple" accept="image/*" onChange={this.readFile} ref={(input) => { this.imgInput = input; }}/>
        <button className="btn-open" onClick={this.handleOpenClick} title="open image"></button>
        <button className="btn-clear" onClick={this.handleClearClick} title="clear image"></button>
        <button className="btn-census" onClick={this.handleCensusClick} title="census color"></button>
        <input type="number"  className="input-K"  value={this.state.K} onChange={this.handleKInput} title="K means" />
      </div>
    );
  }
}

export default ImageShowcase;
