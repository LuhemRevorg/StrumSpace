import cv2
from ultralytics import YOLO
import numpy as np

class GuitarTracker:
    def __init__(self):
        self.model = YOLO("assets/models/best.pt")

    def detect_fretboard(self, frame):
        results = self.model.predict(source=frame, conf=0.4, verbose=False)
        boxes = results[0].boxes.xyxy.cpu().numpy() if results else []

        if len(boxes) == 0:
            return None

        # Merge all boxes into one large fretboard box
        x1 = int(np.min(boxes[:, 0]))
        y1 = int(np.min(boxes[:, 1]))
        x2 = int(np.max(boxes[:, 2]))
        y2 = int(np.max(boxes[:, 3]))

        return (x1, y1, x2, y2)
