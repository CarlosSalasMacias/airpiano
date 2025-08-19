import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Instrument, instruments } from './constants';
import { AudioService } from './services/audioService';
import InstrumentSelector from './components/InstrumentSelector';
import HandVisualizer from './components/HandVisualizer';
import StatusDisplay from './components/StatusDisplay';
import { drawHandLandmarks } from './utils/drawing';

const FINGER_TIPS = { INDEX: 8, MIDDLE: 12, RING: 16, PINKY: 20, THUMB: 4 };

const App: React.FC = () => {
    const [status, setStatus] = useState('Cargando modelo...');
    const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
    const [webcamRunning, setWebcamRunning] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState<Instrument>(instruments[0]);
    const [activeFingers, setActiveFingers] = useState<Set<string>>(new Set());
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioServiceRef = useRef<AudioService | null>(null);
    const lastVideoTimeRef = useRef(-1);
    const animationFrameId = useRef<number | null>(null);
    const fingerStatesRef = useRef<Record<string, { lastY: number; isPressed: boolean }>>({});


    useEffect(() => {
        const createHandLandmarker = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU",
                    },
                    runningMode: "VIDEO",
                    numHands: 2,
                    minHandDetectionConfidence: 0.6,
                    minHandPresenceConfidence: 0.6,
                    minTrackingConfidence: 0.6,
                });
                setHandLandmarker(landmarker);
                setStatus('Listo para iniciar webcam');
            } catch (error) {
                console.error("Error loading HandLandmarker model:", error);
                setStatus('Error al cargar el modelo. Revisa la consola.');
            }
        };
        createHandLandmarker();
        audioServiceRef.current = new AudioService(selectedInstrument.synth);
    }, [selectedInstrument.synth]);

    const handleInstrumentChange = (instrument: Instrument) => {
        setSelectedInstrument(instrument);
        if (audioServiceRef.current) {
            audioServiceRef.current.setInstrument(instrument.synth);
        }
    };

    const processLandmarksForMusic = useCallback((landmarks: any[]) => {
        const PRESS_VELOCITY_THRESHOLD = 0.01; // Sensitivity for press detection
        const RELEASE_THRESHOLD = -0.005;      // How much the finger must move up to reset

        landmarks.forEach((hand, handIndex) => {
            const palmCenterY = (hand[5].y + hand[17].y) / 2;
            if (!palmCenterY) return;

            const octave = 4 - Math.floor(palmCenterY * 3);

            const FINGER_MAPPING = [
                { name: 'C', tipIndex: FINGER_TIPS.INDEX },
                { name: 'D', tipIndex: FINGER_TIPS.MIDDLE },
                { name: 'E', tipIndex: FINGER_TIPS.RING },
                { name: 'F', tipIndex: FINGER_TIPS.PINKY },
            ];

            FINGER_MAPPING.forEach((finger) => {
                const fingerTip = hand[finger.tipIndex];
                if (!fingerTip) return;

                const triggerId = `h${handIndex}-f${finger.tipIndex}`;
                
                // Initialize state if not present
                if (!fingerStatesRef.current[triggerId]) {
                    fingerStatesRef.current[triggerId] = { lastY: fingerTip.y, isPressed: false };
                }
                const state = fingerStatesRef.current[triggerId];
                const deltaY = fingerTip.y - state.lastY;

                // Press detection: finger moved down fast enough and wasn't already pressed
                if (deltaY > PRESS_VELOCITY_THRESHOLD && !state.isPressed) {
                    const note = `${finger.name}${octave}`;
                    audioServiceRef.current?.playNote(note, '8n');
                    state.isPressed = true;
                    
                    // Visual feedback trigger
                    setActiveFingers(prev => new Set(prev).add(triggerId));
                    setTimeout(() => {
                        setActiveFingers(prev => {
                            const next = new Set(prev);
                            next.delete(triggerId);
                            return next;
                        });
                    }, 200);
                } 
                // Release detection: finger moved up enough
                else if (deltaY < RELEASE_THRESHOLD && state.isPressed) {
                    state.isPressed = false;
                }

                // Update lastY for the next frame
                state.lastY = fingerTip.y;
            });
        });
    }, []);

    const predictWebcam = useCallback(async () => {
        if (!webcamRunning || !videoRef.current || !canvasRef.current || !handLandmarker) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');

        if (video.videoWidth === 0 || video.videoHeight === 0) {
            animationFrameId.current = requestAnimationFrame(predictWebcam);
            return;
        }
        
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
        
        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const results = handLandmarker.detectForVideo(video, performance.now());

            if (canvasCtx) {
                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                drawHandLandmarks(canvasCtx, results.landmarks, video.videoWidth, video.videoHeight, activeFingers);
                canvasCtx.restore();
            }

            if (results.landmarks.length > 0) {
                processLandmarksForMusic(results.landmarks);
            }
        }

        animationFrameId.current = requestAnimationFrame(predictWebcam);
    }, [handLandmarker, webcamRunning, processLandmarksForMusic, activeFingers]);

    const toggleWebcam = async () => {
        if (!handLandmarker) return;
        if (webcamRunning) {
            setWebcamRunning(false);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            setStatus('Webcam detenida. Presiona para iniciar.');
        } else {
            setStatus('Iniciando webcam...');
            setWebcamRunning(true);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener('loadeddata', () => {
                       setStatus('Webcam activa. ¡Mueve tus manos!');
                    });
                }
            } catch (error) {
                console.error("Error accessing webcam:", error);
                setStatus('Error al acceder a la webcam.');
                setWebcamRunning(false);
            }
        }
    };
    
    useEffect(() => {
        if (webcamRunning) {
            animationFrameId.current = requestAnimationFrame(predictWebcam);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [webcamRunning, predictWebcam]);


    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 font-sans">
            <header className="w-full max-w-5xl text-center mb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Mano Musical
                </h1>
                <p className="text-gray-400 mt-2">Crea música con el movimiento de tus manos en tiempo real.</p>
            </header>

            <main className="w-full max-w-5xl flex flex-col items-center">
                <div className="w-full bg-gray-800 rounded-lg shadow-2xl p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <InstrumentSelector
                            instruments={instruments}
                            selectedInstrument={selectedInstrument}
                            onSelect={handleInstrumentChange}
                        />
                         <button
                            onClick={toggleWebcam}
                            disabled={status.includes('Cargando') || status.includes('Error')}
                            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 ${
                                webcamRunning 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-green-500 hover:bg-green-600'
                            } disabled:bg-gray-500 disabled:cursor-not-allowed`}
                        >
                            {webcamRunning ? 'Detener Webcam' : 'Iniciar Webcam'}
                        </button>
                    </div>
                </div>

                <div className="w-full relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                    <HandVisualizer videoRef={videoRef} canvasRef={canvasRef} />
                    <StatusDisplay status={status} webcamRunning={webcamRunning} />
                </div>
                
                <div className="mt-4 p-4 bg-gray-800 rounded-lg text-center w-full max-w-5xl">
                    <h2 className="text-lg font-bold text-purple-400">¿Cómo funciona?</h2>
                    <p className="text-gray-300 mt-1">Mueve tus dedos hacia abajo rápidamente como si tocaras un piano invisible para producir notas. La altura de tu mano en la pantalla cambia la octava.</p>
                </div>
            </main>
        </div>
    );
};

export default App;
