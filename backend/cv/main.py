import cv2
import time
import threading
from ultralytics import YOLO
from utils.overlay import draw_fretboard_overlay
from utils.audio_chord_detector import wait_for_chord
import json

# Load YOLOv8 model and chord data
model = YOLO("assets/models/best.pt")
with open("assets/data/chords.json") as f:
    chord_data = json.load(f)

# Chord state
chord_sequence = ["Am", "C", "G", "D", "Em"]
current_chord_idx = 0
current_chord = chord_sequence[current_chord_idx]
audio_verified = False
audio_checking = False

# Zone-to-fret mapping
label_to_fret = {f"Zone{i}": i for i in range(1, 13)}

# Background thread to check chord
def audio_check_thread(chord):
    global audio_verified, audio_checking
    audio_checking = True
    if wait_for_chord(chord):
        audio_verified = True
    audio_checking = False

# Open webcam
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Run YOLO detection
    results = model(frame)
    fret_boxes = {}
    for r in results:
        for box in r.boxes:
            label = r.names[int(box.cls[0])]
            conf = float(box.conf[0])
            if label in label_to_fret and conf > 0.5:
                bbox = box.xyxy[0].cpu().numpy().astype(int)
                fret_num = label_to_fret[label]
                fret_boxes[fret_num] = bbox

    # Draw overlay if frets detected
    if fret_boxes:
        frame = draw_fretboard_overlay(frame, chord_data, current_chord, fret_boxes)

    cv2.putText(frame, f"Play: {current_chord}", (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
    cv2.imshow("StrumSpace", frame)

    # Kick off audio check in background if needed
    if not audio_verified and not audio_checking:
        threading.Thread(target=audio_check_thread, args=(current_chord,), daemon=True).start()

    # Handle keys
    key = cv2.waitKey(1)
    if key == ord('q'):
        break
    elif key == ord('n') or audio_verified:
        current_chord_idx = (current_chord_idx + 1) % len(chord_sequence)
        current_chord = chord_sequence[current_chord_idx]
        audio_verified = False

cap.release()
cv2.destroyAllWindows()
