import { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Camera, RefreshCw } from 'lucide-react';
import { getVehicleLabel, formatDateTime } from '../lib/parkingLogic';

export default function QRScanner({ onScanSuccess }) {
    const [scanning, setScanning] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successData, setSuccessData] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(document.createElement('canvas'));
    const animFrame = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        return () => stopScan();
    }, []);

    const startScan = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            setScanning(true);
            setErrorMsg('');
            setSuccessData(null);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                tick();
            }
        } catch (err) {
            setErrorMsg('Tidak dapat mengakses kamera. Izin ditolak.');
        }
    };

    const stopScan = () => {
        setScanning(false);
        if (animFrame.current) cancelAnimationFrame(animFrame.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };

    const tick = () => {
        if (!videoRef.current || !canvasRef.current || !scanning) return;

        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, canvas.width, canvas.height);

            if (code) {
                try {
                    const payload = JSON.parse(code.data);
                    if (payload.v && payload.e) {
                        setSuccessData(payload);
                        onScanSuccess(payload);
                        stopScan();
                        return;
                    }
                } catch {
                    setErrorMsg('Kode QR tidak valid (bukan tiket sistem).');
                }
            }
        }

        if (scanning) {
            animFrame.current = requestAnimationFrame(tick);
        }
    };

    return (
        <div className="glass-card flex flex-col p-6 rounded-3xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-accent border border-indigo-500/20">
                    <Camera size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Scan Tiket QR</h2>
                    <p className="text-slate-400 text-sm">Pindai kode QR dari karcis masuk Anda.</p>
                </div>
            </div>

            <div className="relative w-full aspect-square max-w-sm mx-auto bg-black rounded-2xl overflow-hidden mt-2 border border-white/5 shadow-inner">
                {scanning ? (
                    <>
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-[65%] h-[65%] border-2 border-accent rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent/80 shadow-[0_0_8px_theme(colors.accent)] animate-[scanBeam_2s_ease-in-out_infinite]" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3 p-6 text-center">
                        <Camera size={48} className="opacity-50" />
                        <p className="text-sm">Kamera tidak aktif. Klik tombol di bawah untuk mulai memindai.</p>
                    </div>
                )}
            </div>

            {errorMsg && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
                    {errorMsg}
                </div>
            )}

            {successData && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                    <div className="text-green-400 font-bold mb-1">✅ Berhasil Dibaca!</div>
                    <div className="text-sm text-slate-300">Karcis: {getVehicleLabel(successData.v)}</div>
                    <div className="text-sm text-slate-300">Masuk: {formatDateTime(new Date(successData.e))}</div>
                    <div className="mt-2 text-xs text-slate-400">Data telah diisi otomatis.</div>
                </div>
            )}

            <div className="mt-6">
                {scanning ? (
                    <button onClick={stopScan} className="w-full py-3.5 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                        Hentikan Kamera
                    </button>
                ) : (
                    <button onClick={startScan} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold bg-primary hover:bg-indigo-600 text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                        {successData ? <RefreshCw size={18} /> : <Camera size={18} />}
                        {successData ? 'Scan Ulang' : 'Aktifkan Kamera Scan'}
                    </button>
                )}
            </div>
        </div>
    );
}
