class Noise {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
  }

  makeNoise() {
    const bufferSize = 3 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    var source = this.audioContext.createBufferSource();
    source.buffer = noiseBuffer;
    source.connect(this.audioContext.destination);
    source.start();
  }
}
