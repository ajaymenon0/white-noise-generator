const headTitle = document.title;
class Noise {
  constructor(settings) {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.noiseNode = this.audioContext.createBufferSource();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0;
    this.volume = settings.volume || 0.5; // init volume

    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = settings.cutoff || 1000;

    // Node connections
    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination); 
  }

  play() {
    const bufferSize = 10 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;
    this.gainNode.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 1); // Slight Fade in
    this.noiseNode.start();
  }

  stop() {
    // Slight fade out and stop
    this.gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
    this.noiseNode.stop(this.audioContext.currentTime + 1);
  }
}

class Timer {
  constructor(ele, noisemaker, togglePlayButton) {
    this.secondsLeft = 1500;
    this.ele = ele;
    this.print(this.secondsLeft);
    this.timer;
    this.noise = noisemaker;
    this.togglePlayButton = togglePlayButton;
    this.title = document.title;
  }

  secondsToTimeStamp() {
    const minutes = parseInt(this.secondsLeft/60).toString().padStart(2, '0');
    const seconds = (this.secondsLeft%60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  print() {
    const output = this.secondsToTimeStamp();
    document.title = `${output} · ${headTitle}`;
    this.ele.innerHTML = output;
  }

  start() {
    this.timer = setInterval(() => {
      if(this.secondsLeft > 0) {
        this.secondsLeft--;
        this.print();
      } else {
        this.secondsLeft = 1500;
        this.noise.stop();
        this.stop();
        this.togglePlayButton('stopped');
        this.print();
        const notif = new Notification('End of 25 mins', {
          body: 'Take a break!'
        });
      }
    }, 1000);
  }

  stop() {
    clearInterval(this.timer);
  }

  updateNoisemaker(instance) {
    this.noise = instance;
  }
}

// Thanks https://www.freecodecamp.org/news/javascript-debounce-example/
function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

const playButton = document.getElementById('playbutton');
const showtime = document.getElementById('showtime');
const tomatoreset = document.getElementById('tomatoreset');
const playpauseicon = document.getElementById('playpauseicon');
const controlsliders = document.getElementById('controlsliders');
const volumeslider = document.getElementById('volumeslider');
const cutoffslider = document.getElementById('cutoffslider');
const lastChangedVolume = localStorage.getItem('volume');
const lastChangedCutoff = localStorage.getItem('cutoff');

if (lastChangedVolume){
  volumeslider.value = lastChangedVolume;
}

if (lastChangedCutoff){
  cutoffslider.value = lastChangedCutoff;
}

let newNoise, volume, cutoff, pomodoro;
let playState = 'stopped';
let isPomodoroOn = false;
let showControls = false;

function letsMakeSomeNoise() {
  initNoiseMaker();
  if(pomodoro) pomodoro.start();

  togglePlayButton('playing');
}

function initNoiseMaker(){
  const settings = {
    volume: volumeslider.value / 100,
    cutoff: cutoffslider.value * 100,
  }
  newNoise = new Noise(settings);
  if (pomodoro) pomodoro.updateNoisemaker(newNoise);
  newNoise.play();
}

function stfu() {
  newNoise.stop();
  if(pomodoro) pomodoro.stop();
  else newNoise = null;
  togglePlayButton('stopped');
}

const volumeChange = debounce((e) => {
  localStorage.setItem('volume', e);
  if(newNoise) {
    newNoise.stop();
    if(playState === 'playing') initNoiseMaker();
  }
})

const cutoffChange = debounce((e) => {
  localStorage.setItem('cutoff', e);
  if(newNoise) {
    newNoise.stop();
    if(playState === 'playing') initNoiseMaker();
  }
});

const togglePomodoro = () => {
  isPomodoroOn = !isPomodoroOn;
  if (isPomodoroOn) {
    tomatoreset.classList.add('showreset');
    showtime.classList.remove('timerhide');
    pomodoro = new Timer(showtime, newNoise, togglePlayButton);
    if (playState === 'playing') stfu();
  } else {
    tomatoreset.classList.remove('showreset');
    showtime.classList.add('timerhide');
    document.title = headTitle;
    if(pomodoro) pomodoro.stop();
    pomodoro = null;
  }
}

function togglePlayButton(mode) {
  switch(mode) {
    case 'playing':
      playState = 'playing';
      playButton.onclick = stfu;
      rippleBtn();
      playpauseicon.classList.remove('fa-play');
      playpauseicon.classList.add('fa-pause');
      break;
    default:
      playState = 'stopped';
      playButton.onclick = () => {
        if(pomodoro) pomodoro.start();
        initNoiseMaker();
        playState = 'playing';
        playButton.onclick = stfu;
        rippleBtn();
        playpauseicon.classList.remove('fa-play');
        playpauseicon.classList.add('fa-pause');
      }
      playpauseicon.classList.add('fa-play');
      playpauseicon.classList.remove('fa-pause');
  }
}

function resetTimer() {
  stfu();
  pomodoro = new Timer(showtime, newNoise, togglePlayButton);
}

function toggleControls() {
  showControls = !showControls;
  if (showControls) {
    controlsliders.style.transform = "translateX(0%)";
    controlsliders.style.visibility = 'visible';
    controlsliders.style.opacity = 1;
    tomatoreset.style.bottom = '-40px';
  } else {
    controlsliders.style.transform = "translateX(120%)";
    controlsliders.style.opacity = 0;
    controlsliders.style.visibility = 'hidden';
    tomatoreset.style.bottom = '0px';
  }
}

function rippleBtn() {
  playButton.classList.add('ripple');
  setTimeout(() => {
    playButton.classList.remove('ripple');
  }, 1000);
}

if(Notification.permission !== 'denied') {
  Notification.requestPermission().then((permission) => {
    if(permission === 'granted') {
      console.log('User has allowed notifications');
    }
  });
}