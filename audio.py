import sounddevice as sd
import numpy as np
from pynput import keyboard
import queue
import threading
import whisper
from scipy.io import wavfile
import tempfile
import os
import subprocess
import sys

class AudioTranscriber:
    def __init__(self):
        self.recording = False
        self.audio_queue = queue.Queue()
        self.model = whisper.load_model("base")
        self.transcript = ""
        self.sample_rate = 16000
        
    def audio_callback(self, indata, frames, time, status):
        if self.recording:
            self.audio_queue.put(indata.copy())
    
    def process_audio(self):
        while True:
            if not self.recording and self.audio_queue.empty():
                continue
                
            # Collect audio chunks
            audio_data = []
            try:
                while True:
                    audio_data.append(self.audio_queue.get_nowait())
            except queue.Empty:
                pass
            
            if len(audio_data) > 0:
                # Combine audio chunks
                audio = np.concatenate(audio_data)
                
                # Save temporary wav file
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                    wavfile.write(temp_file.name, self.sample_rate, audio)
                    
                    # Transcribe
                    result = self.model.transcribe(temp_file.name)
                    
                # Delete temporary file
                os.unlink(temp_file.name)
                
                # Update transcript
                if result["text"].strip():
                    self.transcript += " " + result["text"].strip()
                    print("\nTranscript so far:", self.transcript)
    
    def on_press(self, key):
        try:
            # Check for Ctrl+M
            if key == keyboard.Key.ctrl_l and keyboard.KeyCode.from_char('m'):
                if not self.recording:
                    print("Starting recording...")
                    self.recording = True
                else:
                    print("Stopping recording...")
                    self.recording = False
        except AttributeError:
            pass
    
    def start(self):
        # Start keyboard listener
        keyboard_listener = keyboard.Listener(on_press=self.on_press)
        keyboard_listener.start()
        
        # Start audio processing thread
        processing_thread = threading.Thread(target=self.process_audio)
        processing_thread.daemon = True
        processing_thread.start()
        
        # Start audio stream
        with sd.InputStream(callback=self.audio_callback, 
                          channels=1,
                          samplerate=self.sample_rate):
            print("Press Ctrl+M to start/stop recording...")
            keyboard_listener.join()

if __name__ == "__main__":
    transcriber = AudioTranscriber()
    transcriber.start()