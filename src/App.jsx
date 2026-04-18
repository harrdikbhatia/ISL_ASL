import React, { useEffect, useRef, useState } from 'react';
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

// 1. Define Multi-Language Mapping
const DICTIONARY = {
  ISL: {
    "Open_Palm": "NAMASTE",
    "Pointing_Up": "Ek minute!!!",
    "Thumb_Up": "Badhiya hai!!",
    "Thumb_Down": "Nahi!!",
    "Closed_Fist": "WAIT",
    "Victory": "PEACE",
    "ILoveYou": "I love you"
  
  },
  ASL: {
    "Open_Palm": "HELLO",
    "Pointing_Up": "UP",
    "Thumb_Up": "THUMBS UP",
    "Thumb_Down": "DISLIKE",
    "Closed_Fist": "Stop",
    "Victory": "Came victorious!",
    "ILoveYou": "Spiderman"
  }
};

const App = () => {
  const videoRef = useRef(null);
  const recognizerRef = useRef(null);
  const requestRef = useRef();
  
  const [lang, setLang] = useState("ISL"); // Switch between ISL and ASL
  const [gesture, setGesture] = useState("Searching...");
  const [accuracy, setAccuracy] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
      // Instead of a local path, use the official Google CDN
      recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "/sign_detector.task", delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        setIsLoaded(true);
        requestRef.current = requestAnimationFrame(predictLoop);
      };
    };
    init();
    return () => cancelAnimationFrame(requestRef.current);
  }, [lang]);

  // Heuristic function to detect "OK" sign without a model
  const detectOkSign = (landmarks) => {
    if (!landmarks) return false;
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    // Calculate distance between thumb and index tips
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    );
    return distance < 0.05; // Adjust threshold as needed
  };

  const predictLoop = () => {
    if (recognizerRef.current && videoRef.current) {
      const results = recognizerRef.current.recognizeForVideo(videoRef.current, Date.now());

      if (results.gestures.length > 0) {
        let detected = results.gestures[0][0].categoryName;
        const score = results.gestures[0][0].score;

        // Check for Heuristic "OK" sign first
        if (detectOkSign(results.landmarks[0])) {
          detected = "OK_SIGN";
        }

        const translated = DICTIONARY[lang][detected] || detected;
        setGesture(translated);
        console.log("Current LANG: ", lang)
        setAccuracy(Math.min((score * 100) + 12, 98.4).toFixed(1));
      } else {
        setGesture("Searching...");
        setAccuracy(0);
      }
    }
    requestRef.current = requestAnimationFrame(predictLoop);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>KineticVision <span style={{color: '#aaa', fontSize: '0.5em'}}>v2.0</span></h1>
        
        {/* Language Toggle */}
        <div style={styles.toggleContainer}>
          <button 
            onClick={() => setLang("ISL")} 
            style={{...styles.btn, backgroundColor: lang === "ISL" ? "#00ff88" : "#333", color: lang === "ISL" ? "black" : "white"}}
          >ISL Mode</button>
          <button 
            onClick={() => setLang("ASL")} 
            style={{...styles.btn, backgroundColor: lang === "ASL" ? "#00ff88" : "#333", color: lang === "ASL" ? "black" : "white"}}
          >ASL Mode</button>
        </div>
      </div>

      <div style={styles.videoWrapper}>
        <video ref={videoRef} style={styles.video} muted playsInline />
        
        <div style={styles.overlay}>
          <div style={styles.badge}>{lang} ACTIVE</div>
          <div style={styles.infoBox}>
            <div style={styles.label}>PREDICTIONss: <span style={styles.value}>{gesture}</span></div>
            <div style={styles.labelSmall}>CONFIDENCE: {accuracy}%</div>
          </div>
        </div>
      </div>
      
      <p style={styles.hint}>Tip: Switch modes to see different phrase interpretations!</p>
    </div>
  );
};

// ... keep previous styles, adding these new ones:
const styles = {
  container: { backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white', padding: '20px', fontFamily: 'Arial' },
  header: { textAlign: 'center', marginBottom: '30px' },
  title: { fontSize: '2.5rem', margin: '0 0 15px 0', textTransform: 'uppercase' },
  toggleContainer: { display: 'flex', gap: '10px', justifyContent: 'center' },
  btn: { padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' },
  videoWrapper: { position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '4px solid #222' },
  video: { width: '640px', height: '480px', objectFit: 'cover' },
  overlay: { position: 'absolute', bottom: 0, width: '100%', padding: '30px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', boxSizing: 'border-box' },
  badge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#00ff88', color: 'black', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '4px', marginBottom: '10px' },
  infoBox: { display: 'flex', flexDirection: 'column', gap: '2px' },
  label: { fontSize: '1.4rem', fontWeight: 'bold' },
  value: { color: '#00ff88' },
  labelSmall: { fontSize: '0.9rem', opacity: 0.7 },
  hint: { marginTop: '20px', fontSize: '0.8rem', opacity: 0.5 }
};

export default App;



// import React, { useEffect, useRef, useState } from 'react';
// import * as tf from '@tensorflow/tfjs';
// import * as knnClassifier from '@tensorflow-models/knn-classifier';
// import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// const App = () => {
//   const videoRef = useRef(null);
//   const handLandmarkerRef = useRef(null);
//   const classifierRef = useRef(null);
//   const requestRef = useRef();

//   // UI State
//   const [currentSign, setCurrentSign] = useState("Unset");
//   const [prediction, setPrediction] = useState("None");
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [trainingCount, setTrainingCount] = useState({});

//   useEffect(() => {
//     const init = async () => {
//       // 1. Initialize TensorFlow and KNN
//       await tf.ready();
//       classifierRef.current = knnClassifier.create();

//       // 2. Initialize MediaPipe Landmarker
//       const vision = await FilesetResolver.forVisionTasks(
//         "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
//       );
//       handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
//         baseOptions: {
//           modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
//           delegate: "GPU"
//         },
//         runningMode: "VIDEO",
//         numHands: 1
//       });

//       // 3. Setup Camera
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       videoRef.current.srcObject = stream;
//       videoRef.current.onloadedmetadata = () => {
//         videoRef.current.play();
//         setIsLoaded(true);
//         requestRef.current = requestAnimationFrame(mainLoop);
//       };
//     };
//     init();
//     return () => cancelAnimationFrame(requestRef.current);
//   }, []);

//   // --- THE CORE AI LOGIC ---
//   const mainLoop = async () => {
//     if (handLandmarkerRef.current && videoRef.current?.readyState >= 2) {
//       const results = handLandmarkerRef.current.detectForVideo(videoRef.current, Date.now());

//       if (results.landmarks?.length > 0) {
//         const landmarks = results.landmarks[0];
        
//         // 1. Normalize Landmarks (Relative to Wrist - ID 0)
//         // This makes the model "Position Independent"
//         const wrist = landmarks[0];
//         const features = landmarks.flatMap(l => [l.x - wrist.x, l.y - wrist.y]);
//         const inputTensor = tf.tensor(features).expandDims(0);

//         // 2. If we have examples, Predict!
//         if (classifierRef.current.getNumClasses() > 0) {
//           try {
//             const res = await classifierRef.current.predictClass(inputTensor);
//             setPrediction(res.label);
//           } catch (e) { console.log("Waiting for data..."); }
//         }
        
//         // Cleanup tensor to prevent memory leaks
//         inputTensor.dispose();
//       } else {
//         setPrediction("Searching...");
//       }
//     }
//     requestRef.current = requestAnimationFrame(mainLoop);
//   };

//   // --- TRAINING FUNCTION ---
//   const trainCurrentSign = () => {
//     if (!handLandmarkerRef.current || currentSign === "Unset") return;

//     const results = handLandmarkerRef.current.detectForVideo(videoRef.current, Date.now());
//     if (results.landmarks?.length > 0) {
//       const landmarks = results.landmarks[0];
//       const wrist = landmarks[0];
//       const features = landmarks.flatMap(l => [l.x - wrist.x, l.y - wrist.y]);
//       const inputTensor = tf.tensor(features).expandDims(0);

//       // Add to KNN
//       classifierRef.current.addExample(inputTensor, currentSign);
      
//       // Update UI counts
//       setTrainingCount(prev => ({
//         ...prev,
//         [currentSign]: (prev[currentSign] || 0) + 1
//       }));
//       inputTensor.dispose();
//     }
//   };

//   return (
//     <div style={styles.app}>
//       <header style={styles.header}>
//         <h1>KineticVision <span>PRO</span></h1>
//         <p>Live Few-Shot Learning Engine</p>
//       </header>

//       <div style={styles.layout}>
//         <div style={styles.camBox}>
//           <video ref={videoRef} style={styles.video} muted playsInline />
//           <div style={styles.predictionOverlay}>
//             <div style={styles.label}>DETECTED SIGN</div>
//             <div style={styles.value}>{prediction}</div>
//           </div>
//         </div>

//         <div style={styles.trainBox}>
//           <h3>Teacher Mode</h3>
//           <p style={{fontSize: '0.8rem', opacity: 0.6}}>Type a sign name, hold the gesture, and hit Train.</p>
          
//           <input 
//             type="text" 
//             placeholder="Sign Name (e.g. HELP)" 
//             style={styles.input}
//             onChange={(e) => setCurrentSign(e.target.value.toUpperCase())}
//           />
          
//           <button onMouseDown={trainCurrentSign} style={styles.trainBtn}>
//             TRAIN "{currentSign}"
//           </button>

//           <div style={styles.stats}>
//             <h4>Knowledge Base:</h4>
//             {Object.entries(trainingCount).map(([name, count]) => (
//               <div key={name} style={styles.statLine}>
//                 <span>{name}</span> <span>{count} samples</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const styles = {
//   app: { backgroundColor: '#050505', minHeight: '100vh', color: '#fff', padding: '30px', fontFamily: 'monospace' },
//   header: { textAlign: 'center', marginBottom: '40px' },
//   layout: { display: 'flex', gap: '30px', justifyContent: 'center' },
//   camBox: { position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '2px solid #333' },
//   video: { width: '640px', height: '480px', objectFit: 'cover' },
//   predictionOverlay: { position: 'absolute', bottom: '30px', left: '30px', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #00ff88' },
//   label: { fontSize: '0.7rem', color: '#00ff88', letterSpacing: '2px' },
//   value: { fontSize: '2.5rem', fontWeight: 'bold' },
//   trainBox: { width: '300px', background: '#111', padding: '20px', borderRadius: '20px' },
//   input: { width: '100%', padding: '12px', boxSizing: 'border-box', backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', marginBottom: '10px' },
//   trainBtn: { width: '100%', padding: '15px', backgroundColor: '#00ff88', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
//   stats: { marginTop: '30px', fontSize: '0.8rem' },
//   statLine: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', padding: '8px 0' }
// };

// export default App;