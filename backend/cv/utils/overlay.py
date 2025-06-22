import cv2

def draw_fretboard_overlay(frame, chord_data, chord_name, fret_boxes):
    num_strings = 6
    positions = chord_data.get(chord_name, [])
    if not positions:
        print(f"⚠️ No data for chord: {chord_name}")
        return frame

    for fret, string in positions:
        if fret not in fret_boxes or not (1 <= string <= 6):
            continue

        x1, y1, x2, y2 = fret_boxes[fret]
        if x2 <= x1:
            print(f"⚠️ Invalid box for fret {fret}")
            continue

        string_spacing = (x2 - x1) / (num_strings - 1)
        col = num_strings - string  # reversed direction

        cx = int(x1 + col * string_spacing)
        cy = int((y1 + y2) / 2)

        print(f"🎯 Fret {fret}, String {string} → Dot at ({cx}, {cy})")
        cv2.circle(frame, (cx, cy), 14, (0, 0, 255), -1)  # slightly larger dot

    return frame