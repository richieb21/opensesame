import os
import sounddevice as sd
import numpy as np
from groq import Groq
import wave
from collections import deque
from datetime import datetime
import threading
import queue
from scipy import signal

# Initialize the Groq client
client = Groq()

# Audio configuration
CHANNELS = 2
RATE = 48000  # Higher quality recording
CHUNK = 1024
SEGMENT_DURATION = 3
MAX_TRANSCRIPT_SECONDS = 15
transcript_buffer = deque(maxlen=MAX_TRANSCRIPT_SECONDS)
audio_queue = queue.Queue()

def apply_dynamic_processing(audio_data, threshold=-50, ratio=2):
    db = 20 * np.log10(np.abs(audio_data) + 1e-10)
    mask = db > threshold
    gain_reduction = np.zeros_like(db)
    gain_reduction[mask] = -(db[mask] - threshold) * (1 - 1/ratio)
    return audio_data * np.power(10, gain_reduction/20)

def apply_noise_reduction(audio_data, noise_reduction_strength=0.1):
    freq_mask = np.abs(np.fft.rfft(audio_data, axis=0))
    noise_threshold = np.mean(freq_mask) * noise_reduction_strength
    mask = freq_mask > noise_threshold
    freq_data = np.fft.rfft(audio_data, axis=0)
    freq_data *= mask
    return np.fft.irfft(freq_data, n=len(audio_data), axis=0)

def record_audio():
    # Find BlackHole device
    devices = sd.query_devices()
    device_id = None
    for i, device in enumerate(devices):
        if 'BlackHole' in device['name']:
            device_id = i
            break
    
    if device_id is None:
        print("BlackHole device not found!")
        return

    while True:
        try:
            frames = []
            with sd.InputStream(
                device=device_id,
                samplerate=RATE,
                channels=CHANNELS,
                dtype=np.float32,
                blocksize=CHUNK,
                latency='high'
            ) as stream:
                # Record for one second
                for _ in range(0, int(RATE / CHUNK * SEGMENT_DURATION)):
                    data, overflowed = stream.read(CHUNK)
                    if overflowed:
                        print("Audio buffer has overflowed")
                    if np.abs(data).mean() > 0.0001:
                        frames.append(data)

            if frames:
                # Process audio
                audio_data = np.concatenate(frames, axis=0)
                audio_data = audio_data - np.mean(audio_data, axis=0)
                audio_data = apply_noise_reduction(audio_data)
                audio_data = apply_dynamic_processing(audio_data)

                # Apply low-pass filter
                nyquist = RATE / 2
                cutoff = 18000
                b, a = signal.butter(4, cutoff/nyquist, btype='low')
                audio_data = signal.filtfilt(b, a, audio_data, axis=0)

                # Normalize
                peak = np.max(np.abs(audio_data))
                if peak > 0:
                    audio_data = audio_data / peak * 0.9

                # Noise gate
                noise_floor = 0.001
                audio_data[np.abs(audio_data) < noise_floor] = 0

                # Convert to 16-bit PCM
                audio_data_int16 = (audio_data * 32767).astype(np.int16)

                # Save temporary file
                filename = f"segment_{datetime.now().timestamp()}.wav"
                with wave.open(filename, 'wb') as wf:
                    wf.setnchannels(CHANNELS)
                    wf.setsampwidth(2)
                    wf.setframerate(RATE)
                    wf.writeframes(audio_data_int16.tobytes())

                # Put filename in queue for processing
                audio_queue.put(filename)

        except KeyboardInterrupt:
            break

def process_audio():
    while True:
        try:
            filename = audio_queue.get()
            
            with open(filename, "rb") as file:
                transcription = client.audio.transcriptions.create(
                    file=(filename, file.read()),
                    model="whisper-large-v3-turbo",
                    response_format="json",
                    language="en",
                    temperature=0.0
                )
            
            if transcription.text.strip():
                transcript_buffer.append(transcription.text)
            
            os.remove(filename)
            
            print("\n=== Last 15 seconds of transcript ===")
            print(" ".join(transcript_buffer))
            print("=====================================\n")
            
        except Exception as e:
            print(f"Error processing audio: {e}")
        finally:
            audio_queue.task_done()

def main():
    print("Starting live transcription (Press Ctrl+C to stop)...")
    
    record_thread = threading.Thread(target=record_audio, daemon=True)
    process_thread = threading.Thread(target=process_audio, daemon=True)
    
    record_thread.start()
    process_thread.start()
    
    try:
        while True:
            record_thread.join(0.1)
    except KeyboardInterrupt:
        print("\nStopping transcription...")

if __name__ == "__main__":
    main()