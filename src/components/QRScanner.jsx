import { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Camera, X, StopCircle, CheckCircle2 } from 'lucide-react';

export default function QRScanner({ onScanSuccess }) {
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
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = s;
            if (videoRef.current) {
                videoRef.current.srcObject = s;
                videoRef.current.play();
                requestAnimationFrame(tick);
            }
        } catch (e) {
            console.error(e);
            alert('Akses kamera ditolak atau tidak tersedia.');
            setScanning(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const tick = () => {
        if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
            if (scanning) requestAnimationFrame(tick);
            return;
        }
        const vx = videoRef.current;
        const cx = canvasRef.current;
        cx.width = vx.videoWidth;
        cx.height = vx.videoHeight;
        const ctx = cx.getContext('2d');
        ctx.drawImage(vx, 0, 0, cx.width, cx.height);

        const imgData = ctx.getImageData(0, 0, cx.width, cx.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });

        if (code) {
            handleScan(code.data);
            return;
        }

        if (scanning) requestAnimationFrame(tick);
    };

    const handleScan = (data) => {
        setResult(data);
        setScanning(false);
        try {
            const parsed = JSON.parse(data);
            // Simulate processing time for UX
            setTimeout(() => onScanSuccess(parsed), 1500);
        } catch (e) {
            setTimeout(() => alert("Format QR Code tidak dikenali."), 500);
        }
    };

    return (
        <div className="glass anim-fade-in overflow-hidden relative border-slate-200">
            <div className="absolute top-4 left-4 z-10 chip bg-white text-indigo-700 shadow-sm border border-slate-100 font-bold px-3 py-1.5 flex items-center gap-2">
                {scanning ? (
                    <><span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Tracking ID/QR</>
                ) : (
                    <><CheckCircle2 size={14} className="text-emerald-500" /> Terdeteksi</>
                )}
            </div>

            <div className="relative aspect-[4/5] sm:aspect-video bg-slate-900 overflow-hidden">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-80" playsInline muted autoPlay />
                <canvas ref={canvasRef} className="hidden" />

                {/* Elegant Scan Frame for Light UI (Slate overlay) */}
                {scanning && (
                    <div className="scan-frame shadow-[0_0_0_4000px_rgba(15,23,42,0.8)] border border-white/20">
                        {/* Frame Corners */}
                        <div className="scan-corner border-t-0 border-l-0 bottom-0 right-0 border-white/70"></div>
                        <div className="scan-corner border-t-0 border-r-0 bottom-0 left-0 border-white/70"></div>
                        <div className="scan-corner border-b-0 border-l-0 top-0 right-0 border-white/70"></div>
                        <div className="scan-corner border-b-0 border-r-0 top-0 left-0 border-white/70"></div>
                        <div className="scan-line bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                    </div>
                )}

                {/* Success Overlay */}
                {result && (
                    <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center anim-fade-in p-6 text-center text-white">
                        <CheckCircle2 size={48} className="mb-4 animate-bounce" />
                        <h3 className="font-bold text-lg mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Kode Diterima</h3>
                        <p className="text-xs font-mono bg-black/20 p-2 rounded-lg break-all select-all font-bold tracking-tight border border-white/20">
                            {result}
                        </p>
                        <p className="text-[10px] mt-4 opacity-80 uppercase tracking-widest font-bold">Memuat Data...</p>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-500 mb-4 font-medium uppercase tracking-widest leading-relaxed">
                    Arahkan kamera ke tiket fisik atau kode digital Gandaria City
                </p>
                <div className="flex justify-center">
                    <button
                        onClick={() => { setScanning(!scanning); setResult(null); }}
                        className={`btn-secondary text-xs px-6 py-2.5 rounded-xl uppercase tracking-wider ${scanning ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 hover:border-rose-200 hover:text-rose-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                        {scanning ? <><StopCircle size={14} /> Batalkan</> : <><Camera size={14} /> Pindai</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
