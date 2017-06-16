import React, { Component } from 'react';
import brain from 'brain';
import {rgbToHsl, hslToRgb, rgbToHex} from './util/utils.js';
import {trainData1,network1,network2} from './util/trainData.js';
import ImageShowcase from './components/ImageShowcase.js';
import ColorBar from './components/ColorBar.js';
import ColorCard from './components/ColorCard.js';
import CanvasBubbleChart from './components/CanvasBubbleChart.js';
import ScoreLayer from './components/ScoreLayer.js';
import ImageInfo from './components/ImageInfo.js';

class ColorCensus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      colorsInfo: [],
      clusterColors: [],
      mainColor: '',
      averageColor: '',
      showScoreLayer: false,
      score: '',
      processInfo:{
        colors: 0,
        censusTime: 0,
        kmeansIteration:0,
        kmeansTime:0,
        top5Count: 0
      }
    };
    this.infos = [];
    this.resetApp = this.resetApp.bind(this);
    this.censusColors = this.censusColors.bind(this);
    this.setScoreLayer = this.setScoreLayer.bind(this);
  }

  componentDidMount(){
    this.net = new brain.NeuralNetwork();
    this.net2 = new brain.NeuralNetwork();
    // {
    //   hiddenLayers: [8,8]
    // }
    // let r = this.net.train(trainData1,{
    //   errorThresh: 0.005,  // error threshold to reach
    //   iterations: 2000000,   // maximum training iterations
    //   log: true,           // console.log() progress periodically
    //   logPeriod: 50000,       // number of iterations between logging
    //   learningRate: 0.01    // learning rate
    // });
    // console.log(r)
    // console.log(JSON.stringify(this.net.toJSON()));
    this.net.fromJSON(network1);
    this.net2.fromJSON(network2);
  }

  resetApp(){
     this.setState ({
      colorsInfo: [],
      clusterColors: [],
      mainColor: '',
      averageColor: '',
      score: '',
      processInfo:{
        colors: 0,
        censusTime: 0,
        kmeansIteration:0,
        kmeansTime:0,
        top5Count:0
      }
    });
  }

  chooseSeedColors(colors, num){
    let init_seed = [];
    let len = colors.length;
    let l;
    for (let i = 0; i < len; i++) {
      l = init_seed.length;
      let color = colors[i];
      if (!i) {
        color.category = 0;
        init_seed.push({
          h:color.h,
          s:color.s,
          l:color.l,
          category: color.category,
          fre: color.fre
        });
        continue;
      }
      let j = 0;
      for (; j < l; j++) {
        let h_diff = Math.abs(init_seed[j].h - color.h);
        let s_diff = Math.abs(init_seed[j].s - color.s);
        let l_diff = Math.abs(init_seed[j].l - color.l);
        if (h_diff + s_diff + l_diff < 45) {
          break;
        }
      }
      if (j === l) {
        color.category = init_seed.length;
        init_seed.push({
          h:color.h,
          s:color.s,
          l:color.l,
          category: color.category,
          fre: color.fre
        });
      }
      if (init_seed.length >= num) {
        break;
      }
    }
    return init_seed;
  }

  censusColors(ctx, K, c_w, c_h, isHorizontal, callBack) {
    let start = +new Date();
    let processInfo = {
        colors: 0,
        censusTime: 0,
        kmeansIteration:0,
        kmeansTime:0,
        top5Count:0
    };
    let w = c_w;
    let h = c_h;
    console.log(w,h)
    let imageDate;
     let pixelRatio = window.devicePixelRatio || 1;
    if(isHorizontal){
      imageDate = ctx.getImageData(0, 0, w, h-100*pixelRatio);
    }else{
      imageDate = ctx.getImageData(0, 0, w-100*pixelRatio, h);
    }
    if (!imageDate) {
      console.log("can not read image data, maybe because of cross-domain limitation.");
      return;
    }
    let rows = imageDate.height;
    let cols = imageDate.width;
    console.log(rows,cols)
    let keys = [];
    let colors_info = [];
    let r_key, g_key, b_key,h_key, s_key, l_key, r, g, b;
    let pixel_count = 0;
    let pixel_step = (rows * cols < 600 * 600) ? 1 : 2;
    console.log("pixel step",pixel_step)
    let color_step = Math.round(0.1066*K*K-2.7463*K+17.2795);
    color_step = color_step<4?4:color_step;
    console.log("color step",color_step)

    let hsl,key;
    for (let row = 1; row < rows - 1;) {
      for (let col = 1; col < cols - 1;) {
        r = imageDate.data[row * cols * 4 + col * 4];
        g = imageDate.data[row * cols * 4 + col * 4 + 1];
        b = imageDate.data[row * cols * 4 + col * 4 + 2];
        hsl = rgbToHsl(r,g,b);
        if(hsl[2]> 97 || (hsl[2] > 95 && hsl[1] < 30)){
          col += pixel_step;
          continue;  // too bright
        }
        if(hsl[2] < 3 || (hsl[2] < 5 && hsl[1] < 30)){
          col += pixel_step;
          continue;  // too dark
        }
        pixel_count++;
        h_key = Math.floor(hsl[0] / 10) * 10000;
        s_key = Math.floor(hsl[1] / 5) * 100;
        l_key = Math.floor(hsl[2] / 5);
        key = h_key + s_key + l_key;
        let index = keys.indexOf(key);
        if (index < 0) {
          keys.push(key);
          colors_info.push({
            key: key,
            fre: 1,
            r: r,
            g: g,
            b: b,
            h: hsl[0],
            s: hsl[1],
            l: hsl[2],
            category: -1
          });
        } else {
          colors_info[index].fre++;
        }
        col += pixel_step;
      }
      row += pixel_step;
    }
    console.log("pixel_count: ",pixel_count)
    processInfo.censusTime = +new Date() - start;
    processInfo.colors = colors_info.length;
    console.log("time for process all pixel: ", processInfo.censusTime)

    start = +new Date();
    // sort and filter rgb_census
    colors_info.sort(function(pre, next) {
      return next.fre - pre.fre;
    });
    let len = colors_info.length;
    console.log("before filter: ",len)
    colors_info = colors_info.filter((color) => {
      // isolated color
      let flag = (color.fre < 5 - pixel_step) && (len > 400);
      return !flag;
    });
    console.log("after filter: ",colors_info.length)
    let main_color = [colors_info[0], colors_info[1], colors_info[2]];

    // k-mean clustering
    let init_seed_1 = this.chooseSeedColors(colors_info, K);
    let cluster_res = this.kMC(colors_info, init_seed_1, 100);
    let cluster_res_1 = cluster_res[0];
    cluster_res_1 = cluster_res_1.map((color)=>{
      return  rgbToHex(hslToRgb(color.h, color.s, color.l));
    });

    let r_count = 0, g_count = 0, b_count = 0, f_count = 0;
    len = colors_info.length;
    while (len--) {
      r_count += colors_info[len].r * colors_info[len].fre;
      g_count += colors_info[len].g * colors_info[len].fre;
      b_count += colors_info[len].b * colors_info[len].fre;
      f_count += colors_info[len].fre;
    }

    let average_color = rgbToHsl(Math.floor(r_count / f_count), Math.floor(g_count / f_count), Math.floor(b_count / f_count));
    average_color = {
      h: average_color[0],
      s: average_color[1],
      l: average_color[2],
    };
    let main_color_a = "rgba(" +colors_info[0].r +"," +colors_info[0].g +"," +colors_info[0].b + ",0.68)";

    processInfo.kmeansTime = +new Date() - start;
    processInfo.kmeansIteration = cluster_res[1];
    console.log("time for K-means: ", processInfo.kmeansTime);
    let info = this.imageScore(colors_info);
    processInfo.top5Count = info.top5Count*100;
    this.setState ({
      colorsInfo: colors_info,
      clusterColors: cluster_res_1,
      mainColor: main_color,
      averageColor: average_color,
      processInfo: processInfo
    });
    if (callBack instanceof Function) {
      callBack(main_color_a, cluster_res_1);
    }

  }

  kMC(colors, seeds, max_step) {
    let iteration_count = 0;

    while (iteration_count++ < max_step) {
      // filter seeds
      seeds = seeds.filter((seed) => {
        return seed;
      });

      // divide colors into different categories with duff's device
      let len = colors.length;
      let count = (len / 8) ^ 0;
      let start = len % 8;
      while (start--) {
        this.classifyColor(colors[start], seeds);
      }
      while (count--) {
        this.classifyColor(colors[--len], seeds);
        this.classifyColor(colors[--len], seeds);
        this.classifyColor(colors[--len], seeds);
        this.classifyColor(colors[--len], seeds);
        this.classifyColor(colors[--len], seeds);
        this.classifyColor(colors[--len], seeds);
        this.classifyColor(colors[--len], seeds);
        this.classifyColor(colors[--len], seeds);
      }

      // compute center of category
      len = colors.length;
      let hsl_count = [];
      let category;
      while (len--) {
        category = colors[len].category;
        if (!hsl_count[category]) {
          hsl_count[category] = {};
          hsl_count[category].h = 0;
          hsl_count[category].s = 0;
          hsl_count[category].l = 0;
          hsl_count[category].fre_count = colors[len].fre;
        } else {
          hsl_count[category].fre_count += colors[len].fre;
        }
      }
      len = colors.length;
      while (len--) {
        category = colors[len].category;
        hsl_count[category].h += colors[len].h*colors[len].fre/hsl_count[category].fre_count;
        hsl_count[category].s += colors[len].s*colors[len].fre/hsl_count[category].fre_count;
        hsl_count[category].l += colors[len].l*colors[len].fre/hsl_count[category].fre_count;
      }
      let flag = hsl_count.every((ele, index) => {
        return Math.abs(ele.h - seeds[index].h)<0.5 && Math.abs(ele.s - seeds[index].s)<0.5 && Math.abs(ele.l - seeds[index].l)<0.5;
      });
      seeds = hsl_count.map((ele, index) => {
        return {
          h: ele.h,
          s: ele.s,
          l: ele.l,
          category: index,
          fre: ele.fre_count
        };
      });
      if (flag) {
        break;
      }
    }
    console.log("KMC iteration " + iteration_count);
    seeds.sort(function(pre, next) {
      return pre.h - next.h;
    });
    return [seeds,iteration_count];
  }

  classifyColor(color, classes) {
    let len = classes.length;
    let min = 10000;
    let min_index;
    while (len--) {
      let distance = Math.abs(classes[len].h - color.h) + Math.abs(classes[len].s - color.s) + Math.abs(classes[len].l - color.l);
      if (distance < min) {
        min = distance;
        min_index = len;
      }
    }
    color.category = min_index;
  }

  colorToProps(color){
    if(!color){
      return {};
    }
    let _props = {};
    let cStart = '';
    let cMiddle = '';
    let cEnd = '';
    if(color.length===3){
      cStart = rgbToHex(hslToRgb(color[0].h, color[0].s, color[0].l));
      cMiddle = rgbToHex(hslToRgb(color[1].h, color[1].s, color[1].l));
      cEnd = rgbToHex(hslToRgb(color[2].h, color[2].s, color[2].l));
    } else {
      cMiddle = rgbToHex(hslToRgb(color.h, color.s, color.l));
      cStart = rgbToHex(hslToRgb(color.h-30<0?0:(color.h-30), color.s-20<0?0:(color.s-20), color.l+20>100?100:(color.l+20)));
      cEnd = rgbToHex(hslToRgb(color.h+30>360?360:(color.h+30), color.s+20>100?100:(color.s+20), color.l-20<0?0:(color.l-20)));
    }
    _props = {
      colorStart: cStart,
      colorMiddle: cMiddle,
      colorEnd: cEnd
    };
    return _props;
  }

  imageScore(colorInfo){
    let info = {
      colorCount: (Math.log10(colorInfo.length)),
      average:0,
      variance: 0,
      top50Count: 0,
      top50Average: 0,
      top50Variance: 0,
      top20Count: 0,
      top20Average: 0,
      top20Variance: 0,
      top10Count: 0,
      top10Average: 0,
      top10Variance: 0,
      top5Count: 0,
      top5Average: 0,
      top5Variance: 0
    };
    let average = 0;
    let variance = 0;
    let count = 0;
    let top50_count = 0;
    let top50_average = 0;
    let top50_variance = 0;
    let top20_count = 0;
    let top20_average = 0;
    let top20_variance = 0;
    let top10_count = 0;
    let top10_average = 0;
    let top10_variance = 0;
    let top5_count = 0;
    let top5_average = 0;
    let top5_variance = 0;
    let len = colorInfo.length;
    let color;
    while(len--){
      color = colorInfo[len];
      count += color.fre;
      if(len<50){
        top50_count += color.fre;
        if(len<20){
          top20_count += color.fre;
          if(len<10){
            top10_count += color.fre;
            if(len<5){
              top5_count += color.fre;
            }
          }
        }
      }
    }
    len = colorInfo.length;
    info.average = (Math.log10(count/len));
    info.top50Average = (Math.log10(top50_count/50));
    info.top50Count = top50_count/count;
    info.top20Average = (Math.log10(top20_count/20));
    info.top20Count = top20_count/count;
    info.top10Average = (Math.log10(top10_count/10));
    info.top10Count = top10_count/count;
    info.top5Average = (Math.log10(top5_count/5));
    info.top5Count = top5_count/count;
    average = count/len;
    top50_average = top50_count/50;
    top20_average = top20_count/50;
    top10_average = top10_count/50;
    top5_average = top5_count/50;
    while(len--){
      color = colorInfo[len];
      variance += (color.fre - average)*(color.fre - average);
      if(len<50){
        top50_variance += (color.fre - top50_average)*(color.fre - top50_average);
        if(len<20){
          top20_variance += (color.fre - top20_average)*(color.fre - top20_average);
          if(len<10){
            top10_variance += (color.fre - top10_average)*(color.fre - top10_average);
            if(len<5){
              top5_variance += (color.fre - top5_average)*(color.fre - top5_average);
            }
          }
        }
      }
    }
    len = colorInfo.length;
    variance = Math.sqrt(variance/len);
    top50_variance = Math.sqrt(top50_variance/50);
    top20_variance = Math.sqrt(top20_variance/50);
    top10_variance = Math.sqrt(top10_variance/50);
    top5_variance = Math.sqrt(top5_variance/50);
    info.variance = Math.log10(variance);
    info.top50Variance = Math.log10(top50_variance);
    info.top20Variance = Math.log10(top20_variance);
    info.top10Variance = Math.log10(top10_variance);
    info.top5Variance = Math.log10(top5_variance);
    // normalization
    let max = -1;
    for(let key in info){
      if(info[key]>max){
        max = info[key];
      }
    }
    for(let key in info){
      if(info[key]>1){
        info[key] = info[key]/max;
      }
    }
    // let t = 0.7 + 0.1*Math.random();
    // let s = (1-t)*Math.random();
    // let f = 1-t-s;
    // this.infos.push({
    //   input: info,
    //   output: {
    //     first: 0,
    //     second: s,
    //     third: t,
    //     fourth: f
    //   }
    // });
    // if(this.infos.length===20){
    //   console.log(JSON.stringify(this.infos))
    // }
    let t = this.net.run(info);
    let t2 = this.net2.run(info);
    let res_count = t.first + t.second + t.third + t.fourth;
    let score = 100*t.first/res_count + 85*t.second/res_count + 75*t.third/res_count + 65*t.fourth/res_count;
    let res_count2 = t2.first + t2.second + t2.third + t2.fourth;
    let score2 = 100*t2.first/res_count2 + 85*t2.second/res_count2 + 75*t2.third/res_count2 + 65*t2.fourth/res_count2;
    let score_final = score*0.2 + score2*0.8;
    console.log("score: ",score_final)
    setTimeout(()=>{
      this.setState({score:score_final});
    },650);
    // this.setState({score:score_final});
    return info;
  }

  setScoreLayer(val){
    this.setState({
      showScoreLayer: val
    });
    if(val){
      document.body.classList.add("lock");
    }else{
      document.body.classList.remove("lock");
    }
  }

  render() {
    let mcProps =  this.colorToProps(this.state.mainColor);
    let acProps = this.colorToProps(this.state.averageColor);
    return (
      <div className="App">
        <ImageShowcase setScoreLayer={this.setScoreLayer} censusColors={this.censusColors} resetApp={this.resetApp}></ImageShowcase>
        <ScoreLayer score={this.state.score} setScoreLayer={this.setScoreLayer}  showScoreLayer = {this.state.showScoreLayer}></ScoreLayer>
        <ColorBar label="main color" {...mcProps}></ColorBar>
        <ColorBar label="average color" {...acProps}></ColorBar>
        <ColorCard colors={this.state.clusterColors}></ColorCard>
        <ImageInfo processInfo={this.state.processInfo}></ImageInfo>
        <CanvasBubbleChart colors={this.state.colorsInfo}></CanvasBubbleChart>
        <div className="foot-wrap">
          <div className="author">by junz91@foxmail.com</div>
          <a target="_Blank" href="http://weibo.com/u/3234865203"><span className="logo weibo"></span></a>
          <a target="_Blank" href="https://codepen.io/zhaojun/post/cc"><span className="logo codepen"></span></a>
          <a target="_Blank" href="https://github.com/woshizja"><span className="logo github"></span></a>
        </div>
      </div>
    );
  }
}

export default ColorCensus;
