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
  }

  secondsToTimeStamp() {
    const minutes = parseInt(this.secondsLeft/60).toString().padStart(2, '0');
    const seconds = (this.secondsLeft%60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  print() {
    const output = this.secondsToTimeStamp();
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