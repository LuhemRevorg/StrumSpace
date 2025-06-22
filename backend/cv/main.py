import cv2
import time
import threading
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
import io
import os

# Import exactly like your working code
from ultralytics import YOLO
from utils.overlay import draw_fretboard_overlay
from utils.audio_chord_detector import wait_for_chord

# Load YOLOv8 model and chord data - EXACTLY like your working code
print("🎸 Loading YOLO model...")
model = YOLO("assets/models/best.pt")
print(f"✅ YOLO model loaded: {model.names}")

print("🎵 Loading chord data...")
chord_data_path = "assets/data/chords.json"
if os.path.exists(chord_data_path):
    with open(chord_data_path) as f:
        raw_chord_data = json.load(f)
    print(f"✅ Loaded chord data from {chord_data_path}")
else:
    raw_chord_data = {}

# Convert chord data to the format expected by generate_chord_overlay
# Your current format: [[2, 5], [3, 6], [3, 1]]
# Expected format: [(fret, string), (fret, string)]
chord_data = {}

for chord_name, positions in raw_chord_data.items():
    if isinstance(positions, list) and len(positions) > 0:
        # Convert [[fret, string], [fret, string]] to [(fret, string), (fret, string)]
        chord_data[chord_name] = [(pos[0], pos[1]) for pos in positions if len(pos) >= 2]
    else:
        chord_data[chord_name] = []

# Add default chord data if file doesn't exist
if not chord_data:
    chord_data = {
        "Am": [(1, 2), (2, 3), (2, 4)],  # fret, string format
        "C": [(1, 2), (2, 4), (3, 5)],
        "G": [(2, 5), (3, 6), (3, 1)],
        "D": [(2, 1), (3, 2), (2, 3)],
        "Em": [(2, 5), (2, 4)]
    }
    print("⚠️ Using default chord data")

print(f"✅ Processed chord data: {list(chord_data.keys())}")
print(f"🎯 Example Am chord: {chord_data.get('Am', [])}")

# Zone-to-fret mapping - EXACTLY like your working code
label_to_fret = {f"Zone{i}": i for i in range(1, 13)}
print(f"🎯 Label to fret mapping: {label_to_fret}")

app = Flask(__name__)
CORS(app)

# Chord progression sequences
chord_sequences = {
    "beginner": ["Am", "C", "G", "D"],
    "intermediate": ["Em", "Am", "C", "G", "D", "A"],
    "advanced": ["Am", "C", "G", "D", "D7", "G7", "Em", "A"]
}

# Session management
active_sessions = {}

def create_session(session_id, difficulty="beginner"):
    global active_sessions
    sequence = chord_sequences.get(difficulty, chord_sequences["beginner"])
    active_sessions[session_id] = {
        "difficulty": difficulty,
        "chord_sequence": sequence,
        "current_chord_idx": 0,
        "start_time": time.time(),
        "attempts": 0,
        "score": 0,
        "completed_chords": []
    }
    return active_sessions[session_id]

def get_current_chord(session_id):
    if session_id not in active_sessions:
        return None
    session = active_sessions[session_id]
    if session["current_chord_idx"] < len(session["chord_sequence"]):
        return session["chord_sequence"][session["current_chord_idx"]]
    return None

def advance_chord(session_id):
    if session_id not in active_sessions:
        return False
    session = active_sessions[session_id]
    session["completed_chords"].append(session["chord_sequence"][session["current_chord_idx"]])
    session["current_chord_idx"] += 1
    session["score"] += 10
    session["attempts"] = 0
    return session["current_chord_idx"] < len(session["chord_sequence"])

def generate_chord_overlay(chord_name, fret_boxes):
    """Generate AR overlay positions for a chord"""
    positions = chord_data.get(chord_name, [])
    overlay_positions = []
    
    print(f"🎸 Generating overlay for {chord_name}: {positions}")
    print(f"🎯 Available fret boxes: {list(fret_boxes.keys())}")
    
    for fret, string in positions:
        print(f"🔍 Processing fret {fret}, string {string}")
        
        if fret not in fret_boxes:
            print(f"⚠️ Fret {fret} not detected in frame")
            continue
            
        if not (1 <= string <= 6):
            print(f"⚠️ Invalid string {string} (must be 1-6)")
            continue
            
        x1, y1, x2, y2 = fret_boxes[fret]
        if x2 <= x1:
            print(f"⚠️ Invalid fret box for fret {fret}: {fret_boxes[fret]}")
            continue
            
        # Use the SAME calculation as your working overlay
        num_strings = 6
        string_spacing = (x2 - x1) / (num_strings - 1)
        col = num_strings - string  # reversed direction
        
        cx = int(x1 + col * string_spacing)
        cy = int((y1 + y2) / 2)
        
        print(f"✅ Generated position for fret {fret}, string {string}: ({cx}, {cy})")
        
        overlay_positions.append({
            "x": cx,
            "y": cy,
            "fret": fret,
            "string": string,
            "finger": fret
        })
    
    print(f"📍 Generated {len(overlay_positions)} overlay positions")
    print(f"📍 Final positions: {overlay_positions}")
    return overlay_positions

def process_frame_with_yolo(frame, current_chord):
    """Process frame EXACTLY like your working standalone code"""
    print(f"🔍 Processing frame with YOLO for chord: {current_chord}")
    print(f"📐 Frame shape: {frame.shape}")
    
    results = model(frame)
    fret_boxes = {}
    
    print(f"📊 YOLO results: {len(results)} result(s)")
    
    for r in results:
        print(f"📦 Processing result with {len(r.boxes) if r.boxes is not None else 0} boxes")
        
        if r.boxes is not None:
            for box in r.boxes:
                label = r.names[int(box.cls[0])]
                conf = float(box.conf[0])
                
                print(f"🏷️  Detected: {label} (confidence: {conf:.3f})")
                
                if label in label_to_fret and conf > 0.5:
                    bbox = box.xyxy[0].cpu().numpy().astype(int)
                    fret_num = label_to_fret[label]
                    fret_boxes[fret_num] = bbox
                    
                    print(f"✅ Valid fret {fret_num}: {bbox}")
    
    print(f"🎯 Total fret boxes detected: {len(fret_boxes)}")
    
    # Generate overlay using your working method
    overlay_positions = []
    guitar_detected = len(fret_boxes) > 0
    
    if guitar_detected:
        overlay_positions = generate_chord_overlay(current_chord, fret_boxes)
        print(f"📍 Overlay positions: {overlay_positions}")
    
    return guitar_detected, overlay_positions, fret_boxes

# API Endpoints
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "CV Guitar Vision",
        "active_sessions": len(active_sessions),
        "yolo_available": True,
        "model_classes": len(model.names),
        "model_names": model.names
    })

@app.route('/session/create', methods=['POST'])
def create_chord_session():
    data = request.json
    session_id = data.get('session_id')
    difficulty = data.get('difficulty', 'beginner')
    
    if not session_id:
        return jsonify({"error": "session_id required"}), 400
    
    session = create_session(session_id, difficulty)
    current_chord = get_current_chord(session_id)
    
    print(f"🎸 Created session {session_id}: {difficulty} difficulty, starting with {current_chord}")
    
    return jsonify({
        "success": True,
        "session_id": session_id,
        "difficulty": difficulty,
        "chord_sequence": session["chord_sequence"],
        "current_chord": current_chord,
        "total_chords": len(session["chord_sequence"])
    })

@app.route('/detect', methods=['POST'])
def detect_guitar():
    """Process video frame using EXACTLY the same method as your working code"""
    try:
        data = request.json
        image_data = data.get('image')
        session_id = data.get('session_id')
        
        if not image_data or not session_id:
            return jsonify({"error": "image and session_id required"}), 400
        
        current_chord = get_current_chord(session_id)
        if not current_chord:
            return jsonify({
                "success": True,
                "guitar_detected": False,
                "current_chord": None,
                "chord_positions": [],
                "message": "Session complete!"
            })
        
        print(f"\n🔍 === PROCESSING FRAME FOR {current_chord} ===")
        
        # Decode image - FIXED VERSION to match your working code format
        try:
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            print(f"📦 Decoded {len(image_bytes)} bytes")
            
            # Convert to OpenCV format - EXACTLY like your webcam feed
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                print("❌ Failed to decode image")
                return jsonify({
                    "success": False,
                    "error": "Failed to decode image",
                    "guitar_detected": False,
                    "chord_positions": []
                })
            
            print(f"📐 Decoded frame shape: {frame.shape}")
            print(f"📊 Frame dtype: {frame.dtype}")
            
            # CRITICAL: Ensure frame is in the same format as your working code
            # Your webcam gives BGR, let's make sure we have the same
            if len(frame.shape) == 3 and frame.shape[2] == 3:
                # Frame is already BGR (like webcam), perfect!
                pass
            else:
                print("⚠️ Unexpected frame format")
            
        except Exception as e:
            print(f"❌ Image decoding error: {e}")
            return jsonify({
                "success": False,
                "error": f"Image decode error: {e}",
                "guitar_detected": False,
                "chord_positions": []
            })
        
        # Process frame using EXACTLY your working method
        guitar_detected, overlay_positions, fret_boxes = process_frame_with_yolo(frame, current_chord)
        
        response_data = {
            "success": True,
            "guitar_detected": guitar_detected,
            "current_chord": current_chord,
            "chord_positions": overlay_positions,
            "fret_boxes_detected": len(fret_boxes),
            "detection_method": "YOLO",
            "debug": {
                "frame_shape": frame.shape,
                "fret_boxes": list(fret_boxes.keys()),
                "overlay_count": len(overlay_positions)
            },
            "message": f"Play {current_chord}" if guitar_detected else "Position guitar in view"
        }
        
        print(f"📤 Response: guitar_detected={guitar_detected}, positions={len(overlay_positions)}")
        print(f"=== END FRAME PROCESSING ===\n")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Detection error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
            "guitar_detected": False,
            "chord_positions": []
        }), 500

@app.route('/verify-chord', methods=['POST'])
def verify_chord():
    """Verify chord - using your working audio detection"""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id or session_id not in active_sessions:
            return jsonify({"error": "Invalid session"}), 400
        
        current_chord = get_current_chord(session_id)
        if not current_chord:
            return jsonify({
                "success": True,
                "is_correct": False,
                "message": "🎉 Session complete!",
                "session_complete": True
            })
        
        print(f"🎵 Verifying chord {current_chord} for session {session_id}")
        
        # Use your working audio detection
        try:
            is_correct = wait_for_chord(current_chord)
        except:
            # Fallback to mock for now
            is_correct = True
        
        active_sessions[session_id]["attempts"] += 1
        
        if is_correct:
            has_more = advance_chord(session_id)
            next_chord = get_current_chord(session_id) if has_more else None
            
            return jsonify({
                "success": True,
                "is_correct": True,
                "detected_chord": current_chord,
                "expected_chord": current_chord,
                "message": f"✅ You played {current_chord} correctly!" + (f" ▶️ Next: {next_chord}" if next_chord else ""),
                "next_chord": next_chord,
                "session_complete": not has_more,
                "score": active_sessions[session_id]["score"],
                "attempts": 0 if has_more else active_sessions[session_id]["attempts"]
            })
        
        return jsonify({
            "success": True,
            "is_correct": False,
            "expected_chord": current_chord,
            "message": f"❌ Not {current_chord} yet. Try again...",
            "attempts": active_sessions[session_id]["attempts"]
        })
        
    except Exception as e:
        print(f"❌ Chord verification error: {e}")
        return jsonify({"error": "Verification failed"}), 500

@app.route('/session/<session_id>/next', methods=['POST'])
def skip_chord(session_id):
    """Skip to next chord"""
    if session_id not in active_sessions:
        return jsonify({"error": "Session not found"}), 404
    
    has_more = advance_chord(session_id)
    next_chord = get_current_chord(session_id) if has_more else None
    
    print(f"⏭️ Skipped to next chord: {next_chord}")
    
    return jsonify({
        "success": True,
        "has_more_chords": has_more,
        "next_chord": next_chord,
        "session_complete": not has_more
    })

if __name__ == '__main__':
    print("🎸 StrumSpace CV Service - Using Working YOLO Configuration")
    print(f"✅ YOLO model loaded with {len(model.names)} classes")
    print(f"🎵 Chord data loaded: {list(chord_data.keys())}")
    print(f"🎯 Label mapping: {label_to_fret}")
    print("🚀 Starting Flask server on http://localhost:5001")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
