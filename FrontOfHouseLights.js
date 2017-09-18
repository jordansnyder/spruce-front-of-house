'use strict';

var ws281x = require('./ws281x-stub'), //('rpi-ws281x-native'),
  _  = require('underscore'),
  socket = require('socket.io-client'),
  net = require('net');

var frontOfHouse = {
  
  totalLeds: 144,
  intervalRainbow: null,
  rainbowSpeed: 1,
  rainbowDuration: 30000, // Time in milliseconds for booked appointment to run
  pixelData: null,
  intervalCycle: null,
  intervalFade: null,
  currentColorIndex: 0,
  cycleDelay: 5000,
  colorFadeDuration: 1000,
  sunRiseHour : null,
  sunsetHour: null,
  colors: [
    [255,0,0],
    [255,255,255],
    [0,0,255]
  ],
  prideColors: [
    [255,103,154],
    [254,0,0],
    [255,153,52],
    [255,255,1],
    [1,153,52],
    [0,153,200],
    [52,102,153],
    [153,51,153]
  ],
  config: require('./config/config.json'),

  init: function () {

    this.pixelData = new Uint32Array(this.totalLeds);
    ws281x.init(this.totalLeds);

    this.allGreen();

    console.log('connecting to', this.config.url);

    this.socket = socket(this.config.url);

    this.socket.on('connect', function () {
      console.log('socket connected to appointments');
      //this.updateStatus();
    }.bind(this));

    this.socket.on('did-book-appointments', function () {
      this.stop();
      this.rainbow();
    }.bind(this));

    this.socket.on('did-cancel-appointments', function () {
      
    }.bind(this));

  },

  rainbow: function () {

    var offset = 0;

    var interval = setInterval(function () {

      _(this.totalLeds).times(function(i) {
        this.pixelData[i] = this.colorWheel((offset + i) % 256);
      }.bind(this));

      offset = (offset + 1) % 256;
      this.update();

    }.bind(this), this.rainbowSpeed);

    setTimeout(function() {
      this.stop();
      this.defaultColor();
    }.bind(this), this.rainbowDuration);

    this.intervalRainbow = interval;
  },

  colorWheel: function (pos) {
    pos = 255 - pos;
    if (pos < 85) {
      return this.rgb2Int(255 - pos * 3, 0, pos * 3);
    }
    else if (pos < 170) {
      pos -= 85;
      return this.rgb2Int(0, pos * 3, 255 - pos * 3);
    }
    else {
      pos -= 170;
       return this.rgb2Int(pos * 3, 255 - pos * 3, 0);
    }
  },

  rgb2Int: function (r, g, b) {
    var brightness = 1;
    r *= brightness;
    b *= brightness;
    g *= brightness;
    return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
  },

  fill: function (r, g, b) {
    r = Math.abs(r);
    g = Math.abs(g);
    b = Math.abs(b);

    _(this.totalLeds).times(function(i) {
      this.pixelData[i] = this.rgb2Int(r,g,b);
    }.bind(this));

    this.update();
  },

  stop: function () {
    clearInterval(this.intervalCycle);
    clearInterval(this.intervalFade);
    clearInterval(this.intervalRainbow);
  },

  allWhite: function () {
    this.fill(255, 255, 255);
  },
  allBlue: function () {
    this.fill(0, 0, 255);
  },
  allRed: function () {
   this.fill(255, 0, 0);
  },
  allGreen: function () {
    this.fill(0, 255, 0);
  },
  allOff: function () {
    this.fill(0,0,0);
  },
  defaultColor: function () {
    this.cycleColors();
  },
  clear: function () {
    ws281x.reset();
  },
  update: function () {
    ws281x.render(this.pixelData);
  }
};

console.log('initing');
frontOfHouse.init();

