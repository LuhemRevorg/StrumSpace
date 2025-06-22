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

# Try to import optional dependencies
try:
    from ultralytics import YOLO
    model = YOLO("assets/models/best.pt") if os.path.exists("assets/models/best.pt") else None
    YOLO_AVAILABLE = model is not None
except ImportError:
    print("⚠️ YOLO not available - using mock detection")
    model = None
    YOLO_AVAILABLE = False

try:
    from utils.overlay import draw_fretboard_overlay
    from utils.audio_chord_detector import wait_for_chord
    UTILS_AVAILABLE = True
except ImportError:
    print("⚠️ Utils not available - using basic functionality")
    UTILS_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    print("⚠️ PIL not available - using OpenCV for image processing")
    PIL_AVAILABLE = False

# Load chord data
chord_data_path = "assets/data/chords.json"
if os.path.exists(chord_data_path):
    with open(chord_data_path) as f:
        chord_data = json.load(f)
else:
    # Create basic chord data if file doesn't exist
    chord_data = {
        "Am": [[1, 2], [2, 3], [2, 4]],
        "C": [[1, 2], [2, 4], [3, 5]],
        "G": [[2, 5], [3, 6], [3, 1]],
        "D": [[2, 1], [3, 2], [2, 3]]
    }
    print("⚠️ Using default chord data")

# Mock functions for when utils aren't available
def mock_draw_fretboard_overlay(frame, chord_data, current_chord, fret_boxes):
    """Mock overlay function"""
    cv2.putText(frame, f"Mock: {current_chord}", (50, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    return frame

def mock_wait_for_chord(chord):
    """Mock audio detection"""
    time.sleep(1)  # Simulate processing time
    return True  # Always return true for demo

# Use available functions
draw_fretboard_overlay = draw_fretboard_overlay if UTILS_AVAILABLE else mock_draw_fretboard_overlay
wait_for_chord = wait_for_chord if UTILS_AVAILABLE else mock_wait_for_chord
app = Flask(__name__)
CORS(app)

# NEW: Chord progression sequences
chord_sequences = {
    "beginner": ["Am", "C", "G", "D"],
    "intermediate": ["Em", "Am", "C", "G", "D", "A"],
    "advanced": ["Am", "C", "G", "D", "D7", "G7", "Em", "A"]
}

# NEW: Session management
active_sessions = {}

# Your existing variables
current_chord_idx = 0
current_chord = "Am"  # Default
audio_verified = False
audio_checking = False
label_to_fret = {f"Zone{i}": i for i in range(1, 13)}

# Your existing audio check function
def audio_check_thread(chord):
    global audio_verified, audio_checking
    audio_checking = True
    if wait_for_chord(chord):
        audio_verified = True
    audio_checking = False

# NEW: Session management functions
def create_session(session_id, difficulty="beginner"):
    """Create a new chord progression session"""
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
    """Get current chord for a session"""
    if session_id not in active_sessions:
        return None
    session = active_sessions[session_id]
    if session["current_chord_idx"] < len(session["chord_sequence"]):
        return session["chord_sequence"][session["current_chord_idx"]]
    return None

def advance_chord(session_id):
    """Move to next chord"""
    if session_id not in active_sessions:
        return False
    
    session = active_sessions[session_id]
    session["completed_chords"].append(session["chord_sequence"][session["current_chord_idx"]])
    session["current_chord_idx"] += 1
    session["score"] += 10
    session["attempts"] = 0
    
    return session["current_chord_idx"] < len(session["chord_sequence"])

# NEW: Generate AR overlay positions (using your existing chord data format)
def generate_chord_overlay(chord_name, fret_boxes):
    """Generate AR overlay positions for a chord"""
    positions = chord_data.get(chord_name, [])
    overlay_positions = []
    
    for fret, string in positions:
        if fret not in fret_boxes or not (1 <= string <= 6):
            continue
            
        x1, y1, x2, y2 = fret_boxes[fret]
        if x2 <= x1:
            continue
            
        # Calculate string position
        string_spacing = (x2 - x1) / 5  # 6 strings = 5 gaps
        col = 6 - string  # Reverse direction
        
        cx = int(x1 + col * string_spacing)
        cy = int((y1 + y2) / 2)
        
        overlay_positions.append({
            "x": cx,
            "y": cy,
            "fret": fret,
            "string": string,
            "finger": fret  # Simple finger mapping
        })
    
    return overlay_positions

# NEW: API Endpoints
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "CV Guitar Vision",
        "active_sessions": len(active_sessions)
    })

@app.route('/session/create', methods=['POST'])
def create_chord_session():
    """Create a new chord progression session"""
    data = request.json
    session_id = data.get('session_id')
    difficulty = data.get('difficulty', 'beginner')
    
    if not session_id:
        return jsonify({"error": "session_id required"}), 400
    
    session = create_session(session_id, difficulty)
    current_chord = get_current_chord(session_id)
    
    return jsonify({
        "success": True,
        "session_id": session_id,
        "difficulty": difficulty,
        "chord_sequence": session["chord_sequence"],
        "current_chord": current_chord,
        "total_chords": len(session["chord_sequence"])
    })

@app.route('/session/<session_id>/status', methods=['GET'])
def get_session_status(session_id):
    """Get session status"""
    if session_id not in active_sessions:
        return jsonify({"error": "Session not found"}), 404
    
    session = active_sessions[session_id]
    current_chord = get_current_chord(session_id)
    progress = (session["current_chord_idx"] / len(session["chord_sequence"])) * 100
    
    return jsonify({
        "session_id": session_id,
        "current_chord": current_chord,
        "progress": round(progress, 1),
        "score": session["score"],
        "attempts": session["attempts"],
        "is_complete": session["current_chord_idx"] >= len(session["chord_sequence"])
    })

@app.route('/detect', methods=['POST'])
def detect_guitar():
    """Process video frame and return AR overlay"""
    try:
        data = request.json
        image_data = data.get('image')
        session_id = data.get('session_id')
        
        if not image_data or not session_id:
            return jsonify({"error": "image and session_id required"}), 400
        
        # Decode image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        
        # Use PIL if available, otherwise OpenCV
        if PIL_AVAILABLE:
            image = Image.open(io.BytesIO(image_bytes))
            frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        else:
            # Decode with OpenCV
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Get current chord
        current_chord = get_current_chord(session_id)
        if not current_chord:
            return jsonify({
                "success": True,
                "guitar_detected": False,
                "current_chord": None,
                "chord_positions": [],
                "message": "Session complete!"
            })
        
        # Run detection (YOLO if available, otherwise mock)
        fret_boxes = {}
        if YOLO_AVAILABLE and model:
            # Real YOLO detection
            results = model(frame)
            for r in results:
                for box in r.boxes:
                    label = r.names[int(box.cls[0])]
                    conf = float(box.conf[0])
                    if label in label_to_fret and conf > 0.5:
                        bbox = box.xyxy[0].cpu().numpy().astype(int)
                        fret_num = label_to_fret[label]
                        fret_boxes[fret_num] = bbox.tolist()
        else:
            # Mock detection for demo
            fret_boxes = {
                1: [100, 150, 200, 200],
                2: [200, 150, 300, 200], 
                3: [300, 150, 400, 200]
            }
        
        # Generate AR overlay
        guitar_detected = len(fret_boxes) > 0
        overlay_positions = []
        if guitar_detected:
            overlay_positions = generate_chord_overlay(current_chord, fret_boxes)
        
        return jsonify({
            "success": True,
            "guitar_detected": guitar_detected,
            "current_chord": current_chord,
            "chord_positions": overlay_positions,
            "message": f"Play {current_chord}" if guitar_detected else "Position guitar in view"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "guitar_detected": False,
            "chord_positions": []
        }), 500

@app.route('/verify-chord', methods=['POST'])
def verify_chord():
    session_id = request.form.get('session_id')
    audio_file = request.files.get('audio')

    if not session_id or session_id not in active_sessions:
        return jsonify({"error": "Invalid session"}), 400
    if not audio_file:
        return jsonify({"error": "No audio provided"}), 400

    current_chord = get_current_chord(session_id)
    if not current_chord:
        return jsonify({
            "success": True,
            "is_correct": False,
            "message": "🎉 Session complete!",
            "session_complete": True
        })

    # Save uploaded audio
    temp_path = f"temp_audio/{session_id}.webm"
    os.makedirs("temp_audio", exist_ok=True)
    audio_file.save(temp_path)

    # Run audio chord verification
    is_correct = wait_for_chord(current_chord, temp_path)

    # Track attempt
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

    # Wrong chord
    return jsonify({
        "success": True,
        "is_correct": False,
        "expected_chord": current_chord,
        "message": f"❌ Not {current_chord} yet. Try again...",
        "attempts": active_sessions[session_id]["attempts"]
    })



@app.route('/session/<session_id>/next', methods=['POST'])
def skip_chord(session_id):
    """Skip to next chord"""
    if session_id not in active_sessions:
        return jsonify({"error": "Session not found"}), 404
    
    has_more = advance_chord(session_id)
    next_chord = get_current_chord(session_id) if has_more else None
    
    return jsonify({
        "success": True,
        "has_more_chords": has_more,
        "next_chord": next_chord,
        "session_complete": not has_more
    })

def run_webcam_mode():
    """Original webcam functionality - only if dependencies available"""
    if not YOLO_AVAILABLE:
        print("❌ YOLO not available - webcam mode requires ultralytics")
        print("💡 Install with: pip install ultralytics")
        return
        
    global current_chord_idx, current_chord, audio_verified, audio_checking
    
    # Use default sequence for webcam mode
    chord_sequence = chord_sequences["beginner"]
    current_chord = chord_sequence[current_chord_idx]
    
    cap = cv2.VideoCapture(0)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Run YOLO detection
        results = model(frame)
        fret_boxes = {}
        for r in results:
            if r.boxes is not None:
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

if __name__ == '__main__':
    import sys
    
    # Create required directories
    os.makedirs("assets/data", exist_ok=True)
    os.makedirs("assets/models", exist_ok=True)
    
    print("🎸 StrumSpace CV Service")
    print(f"📊 Dependencies: OpenCV ✅, Flask ✅, NumPy ✅")
    print(f"📊 Optional: YOLO {'✅' if YOLO_AVAILABLE else '❌'}, Utils {'✅' if UTILS_AVAILABLE else '❌'}")
    print(f"🎵 Loaded {len(chord_data)} chords: {list(chord_data.keys())}")
    
    if len(sys.argv) > 1 and sys.argv[1] == 'webcam':
        # Run original webcam mode
        print("🎸 Starting webcam mode...")
        run_webcam_mode()
    else:
        # Run API server
        print("🎸 Starting API server mode...")
        print("🚀 Server running on http://localhost:5000")
        print("📋 Endpoints:")
        print("  POST /session/create - Create chord progression session") 
        print("  POST /detect - Process video frame for AR overlay")
        print("  POST /verify-chord - Verify if chord is played correctly")
        print("  GET /session/{id}/status - Get session progress")
        print("  POST /session/{id}/next - Skip to next chord")
        print("💡 Note: Using mock detection since YOLO model not available" if not YOLO_AVAILABLE else "")
        
        app.run(host='0.0.0.0', port=5001, debug=True)
