const fs = require('fs');
const path = require('path');

// Generates a simple RIFF WAV file with a given frequency
function createWav(frequency, durationMs, type = 'sine') {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const chunkSize = 36 + dataSize;
  
  const buffer = Buffer.alloc(44 + dataSize);
  
  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);
  
  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  
  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Envelope parameters to prevent popping
  const attackSamples = Math.min(Math.floor(sampleRate * 0.05), numSamples / 4); // 50ms attack
  const releaseSamples = Math.min(Math.floor(sampleRate * 0.1), numSamples / 4); // 100ms release
  
  // Generate samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Smooth ADSR Envelope
    let envelope = 1;
    if (i < attackSamples) {
      envelope = i / attackSamples; // Fade in
    } else if (i > numSamples - releaseSamples) {
      envelope = (numSamples - i) / releaseSamples; // Fade out
    }
    
    // Extra decay for short sounds (clicks, thuds)
    if (durationMs <= 500) {
      envelope *= Math.exp(-5 * t);
    }
    
    // Lower volume (0.15 amplitude instead of 1.0)
    let sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.15;
    
    // Add a slight harmonic for a warmer tone (less harsh than pure sine)
    sample += Math.sin(2 * Math.PI * (frequency * 2) * t) * envelope * 0.05;

    const maxVal = 32767;
    let intSample = Math.max(-maxVal, Math.min(maxVal, Math.round(sample * maxVal)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }
  
  return buffer;
}

const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Generate some basic placeholder sounds
fs.writeFileSync(path.join(audioDir, 'idle-loop.wav'), createWav(110, 2000)); // A2 (Soft hum)
fs.writeFileSync(path.join(audioDir, 'spin-loop.wav'), createWav(164, 2000)); // E3 (Soft spin drone)
fs.writeFileSync(path.join(audioDir, 'reel-stop.wav'), createWav(65, 200));   // C2 (Low Thud)
fs.writeFileSync(path.join(audioDir, 'win-chime.wav'), createWav(523, 1000)); // C5 (Soft chime)
fs.writeFileSync(path.join(audioDir, 'click.wav'), createWav(330, 100));      // E4 (Soft click)

console.log('Dummy audio files created in public/audio!');
