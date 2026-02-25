import { useEffect, useRef, useState } from 'react';
import { Camera, X, Scan, CheckCircle2 } from 'lucide-react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export default function CameraModal({ onDetected, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [model, setModel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("Memuat Model AI...");
    const streamRef = useRef(null);
    const [detectedVehicle, setDetectedVehicle] = useState(null);

    // Initialize camera and model
    useEffect(() => {
        let isActive = true;
        const init = async () => {
            try {
                // Load TFJS model
                const loadedModel = await cocoSsd.load();
                if (!isActive) return;
                setModel(loadedModel);

                // Start Camera
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (!isActive) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Need to wait for video to load metadata to play and get dimensions
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play();
                        setLoading(false);
                        setStatus("Arahkan kamera ke kendaraan");
                        detectFrame(loadedModel, videoRef.current);
                    };
                }
            } catch (err) {
                console.error(err);
                if (isActive) {
                    setStatus("Kamera tidak diizinkan atau error model.");
                    setLoading(false);
                }
            }
        };

        init();

        return () => {
            isActive = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const detectFrame = async (net, video) => {
        if (!video || video.paused || video.ended || detectedVehicle) return;

        try {
            const predictions = await net.detect(video);

            // Draw boxes
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                for (const p of predictions) {
                    if (p.score > 0.6) {
                        const isCar = ['car', 'truck', 'bus'].includes(p.class);
                        const isMotorcycle = p.class === 'motorcycle';

                        if (isCar || isMotorcycle) {
                            // Draw bounding box
                            const [x, y, width, height] = p.bbox;
                            ctx.strokeStyle = '#4f46e5'; // Indigo-600
                            ctx.lineWidth = 4;
                            ctx.strokeRect(x, y, width, height);

                            // Draw label background
                            ctx.fillStyle = '#4f46e5';
                            ctx.fillRect(x, y - 30, width, 30);

                            // Draw text
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 16px "Space Grotesk", sans-serif';
                            const label = `${p.class} (${Math.round(p.score * 100)}%)`;
                            ctx.fillText(label, x + 10, y - 10);

                            // Auto-select after brief delay to show the box
                            const code = isMotorcycle ? 'motor' : p.class === 'truck' ? 'box' : 'mobil';
                            if (!detectedVehicle) {
                                setDetectedVehicle(code);
                                setStatus(`Terdeteksi: ${code.toUpperCase()}`);
                                setTimeout(() => onDetected(code), 1200);
                                return; // Stop loop after finding one
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }

        if (!detectedVehicle) {
            requestAnimationFrame(() => detectFrame(net, video));
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col anim-fade-in pb-safe">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm relative z-10 rounded-b-3xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner-soft">
                        <Camera size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.5px' }}>AI Vision</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{status}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative overflow-hidden mt-2 mx-2 rounded-3xl bg-slate-800 shadow-inner">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-10">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Memuat Model...</p>
                    </div>
                )}

                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

                {/* Scanning UI Overlays */}
                {!loading && !detectedVehicle && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-64 h-64 border-2 border-dashed border-white/50 rounded-3xl relative">
                            {/* Scanning line animation */}
                            <div className="absolute inset-0 overflow-hidden rounded-3xl">
                                <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(79,70,229,0.5)] absolute animate-[scan_2s_ease-in-out_infinite]" />
                            </div>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-white/20">
                                Posisikan Kendaraan
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Overlay */}
                {detectedVehicle && (
                    <div className="absolute inset-0 bg-indigo-500/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 anim-fade-in text-white">
                        <CheckCircle2 size={64} className="mb-4 animate-bounce" />
                        <h2 className="text-2xl font-black mb-2 uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{detectedVehicle}</h2>
                        <p className="text-xs font-medium tracking-wide opacity-90">Kendaraan Teridentifikasi</p>
                    </div>
                )}
            </div>

            <div className="px-6 py-6 text-center">
                <p className="text-xs text-slate-200 font-medium tracking-wide drop-shadow-md">
                    <Scan size={14} className="inline mr-1.5 mb-0.5" />
                    Point camera at vehicle for auto-detection
                </p>
            </div>
        </div>
    );
}
