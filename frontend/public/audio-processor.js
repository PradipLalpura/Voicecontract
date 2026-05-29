class VoiceContractCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const processorOptions = options.processorOptions || {};
    this.source = processorOptions.source === "system" ? "system" : "microphone";
    this.chunkFrames = Number.isInteger(processorOptions.chunkFrames) ? processorOptions.chunkFrames : 960;
    this.buffer = new Float32Array(this.chunkFrames);
    this.offset = 0;
    this.sequence = 0;
    this.droppedFrames = 0;
    this.port.postMessage({ type: "ready", source: this.source });
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0 || input[0].length === 0) {
      return true;
    }

    const frames = input[0].length;
    for (let frame = 0; frame < frames; frame += 1) {
      let sample = 0;
      for (let channel = 0; channel < input.length; channel += 1) {
        sample += input[channel][frame] || 0;
      }
      sample /= Math.max(1, input.length);
      this.buffer[this.offset] = Math.max(-1, Math.min(1, sample));
      this.offset += 1;

      if (this.offset === this.chunkFrames) {
        this.flush();
      }
    }

    return true;
  }

  flush() {
    const pcm = new ArrayBuffer(this.chunkFrames * 2);
    const view = new DataView(pcm);
    for (let index = 0; index < this.chunkFrames; index += 1) {
      const sample = this.buffer[index];
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(index * 2, int16, true);
    }

    this.port.postMessage(
      {
        type: "audio",
        source: this.source,
        sequence: this.sequence,
        sampleRate,
        frames: this.chunkFrames,
        sentAtMs: Date.now(),
        pcm,
      },
      [pcm],
    );

    this.sequence = (this.sequence + 1) >>> 0;
    this.offset = 0;
  }
}

registerProcessor("vcp-capture-processor", VoiceContractCaptureProcessor);
