import sounddevice as sd
import librosa
import numpy as np
import time
from numpy.linalg import norm

# Define chord templates (simplified triads)
CHORDS = {
    "C": [0, 4, 7],     # C, E, G
    "G": [7, 11, 2],    # G, B, D
    "D": [2, 6, 9],     # D, F#, A
    "A": [9, 1, 4],     # A, C#, E
    "E": [4, 8, 11],    # E, G#, B
    "Em": [4, 7, 11],   # E, G, B
    "Am": [9, 0, 4],    # A, C, E
    "Dm": [2, 5, 9]     # D, F, A
}

NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F',
              'F#', 'G', 'G#', 'A', 'A#', 'B']


def record_audio(duration=2, fs=22050):
    print(f"🎤 Recording for {duration} seconds...")
    audio = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='float32')
    sd.wait()
    return audio.flatten(), fs


def extract_chroma(audio, sr):
    chroma = librosa.feature.chroma_stft(y=audio, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)
    chroma_norm = chroma_mean / np.max(chroma_mean)
    return chroma_norm


def detect_chord(chroma):
    best_score = 0
    best_match = "Unknown"

    for chord, indices in CHORDS.items():
        template = np.zeros(12)
        for i in indices:
            template[i] = 1
        score = np.dot(chroma, template) / (norm(chroma) * norm(template))
        if score > best_score:
            best_score = score
            best_match = chord

    return best_match if best_score > 0.7 else "Unknown"


def wait_for_chord(expected_chord, max_attempts=10):
    print(f"🎯 Waiting until you play: {expected_chord}")
    attempts = 0
    while attempts < max_attempts:
        audio, sr = record_audio(duration=2)
        chroma = extract_chroma(audio, sr)
        detected = detect_chord(chroma)

        if detected == expected_chord:
            print(f"✅ Correct! You played: {detected}")
            return True
        else:
            print(f"❌ Detected: {detected}, expected: {expected_chord}. Try again.\n")
            attempts += 1
    print("⛔ Max attempts reached. Moving on.")
    return False


if __name__ == '__main__':
    # Example usage for manual test
    expected_chord = "Am"
    wait_for_chord(expected_chord)