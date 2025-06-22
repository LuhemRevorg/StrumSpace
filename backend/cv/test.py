import cv2
import json
from ultralytics import YOLO
from utils.overlay import draw_fretboard_overlay

# Load YOLO model
model = YOLO("assets/models/best.pt")
print("✅ YOLO model loaded")
print("📦 Classes:", model.names)

# Map YOLO Zone labels to fret numbers
label_to_fret = {f"Zone{i}": i for i in range(1, 13)}  # Adjust max zone as needed

# Load chord data
with open("assets/data/chords.json") as f:
    chord_data = json.load(f)

chord_sequence = list(chord_data.keys())
current_chord_idx = 0
current_chord = chord_sequence[current_chord_idx]

# Webcam setup
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Camera not detected.")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)
    fret_boxes = {}

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            conf = float(box.conf[0])
            bbox = box.xyxy[0].cpu().numpy().astype(int)
            x1, y1, x2, y2 = bbox

            if label in label_to_fret and conf > 0.5:
                fret_num = label_to_fret[label]
                fret_boxes[fret_num] = [x1, y1, x2, y2]
                # Removed bounding box and label display

    frame = draw_fretboard_overlay(frame, chord_data, current_chord, fret_boxes)

    cv2.putText(frame, f"Play: {current_chord}", (30, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)

    cv2.imshow("Fretboard + Chord Overlay", frame)

    key = cv2.waitKey(1)
    if key == ord("q"):
        break
    elif key == ord("n"):
        current_chord_idx = (current_chord_idx + 1) % len(chord_sequence)
        current_chord = chord_sequence[current_chord_idx]
        print(f"🔁 Switched to: {current_chord}")

cap.release()
cv2.destroyAllWindows()
