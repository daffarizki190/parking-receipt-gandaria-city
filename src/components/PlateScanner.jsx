import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle2, Scan } from 'lucide-react';

export default function PlateScanner({ onDetected, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [scanning, setScanning] = useState(true);
    const [result, setResult] = useState(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (scanning && !result) {
            startCamera();
        } else {
            stopCamera();
        }
        return stopCamera;
    }, [scanning, result]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();

                // Simulate OCR process after 3 seconds of scanning
                setTimeout(() => {
                    handleScan('B 1234 GCT');
                }, 3000);
            }
        } catch (e) {
            console.error(e);
            alert('Akses kamera ditolak atau tidak tersedia.');
            setScanning(false);
            onClose();
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const handleScan = (data) => {
        setResult(data);
        setScanning(false);
        setTimeout(() => onDetected(data), 1500);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col anim-fade-in pb-safe">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md px-4 py-4 flex items-center justify-between shadow-sm relative z-10">
                <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner-soft">
                        <Scan size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.5px' }}>Scan Plat Nomor</h3>
                        <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">
                            {scanning ? 'Menganalisa Plat...' : 'Selesai'}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-80" playsInline muted autoPlay />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning Frame Overlay */}
                {scanning && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-72 h-32 border-2 border-white/50 rounded-xl relative shadow-[0_0_0_4000px_rgba(15,23,42,0.85)]">
                            {/* Scanning line animation */}
                            <div className="absolute inset-0 overflow-hidden rounded-xl">
                                <div className="w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_15px_rgba(74,222,128,0.8)] absolute animate-[scan_2s_ease-in-out_infinite]" />
                            </div>

                            {/* Frame Corners */}
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-green-400 rounded-tl-xl" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-green-400 rounded-tr-xl" />
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-green-400 rounded-br-xl" />

                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border border-white/20 whitespace-nowrap">
                                Posisikan Plat di Dalam Kotak
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Overlay */}
                {result && (
                    <div className="absolute inset-0 bg-green-500/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 anim-fade-in text-white">
                        <CheckCircle2 size={64} className="mb-4 animate-bounce" />
                        <h2 className="text-3xl font-black mb-2 uppercase tracking-widest font-mono border-2 border-white border-dashed px-6 py-2 rounded-lg bg-black/20">
                            {result}
                        </h2>
                        <p className="text-xs font-medium tracking-wide opacity-90 uppercase">Plat Teridentifikasi</p>
                    </div>
                )}
            </div>

            <div className="px-6 py-6 pb-8 text-center bg-slate-900 absolute bottom-0 w-full z-10 border-t border-white/10">
                <p className="text-xs text-slate-300 font-medium tracking-wide">
                    Teknologi AI OCR akan memindai plat secara otomatis
                </p>
            </div>
        </div>
    );
}
