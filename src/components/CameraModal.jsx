import { useState, useRef, useEffect } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { getVehicleLabel } from '../lib/parkingLogic';
import { X, Camera } from 'lucide-react';

const VEHICLE_MAP = {
    car: 'mobil', truck: 'box', bus: 'box', motorcycle: 'motor', bicycle: 'motor',
};

export default function CameraModal({ isOpen, onClose, onDetect }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [model, setModel] = useState(null);
    const [status, setStatus] = useState('Memuat model AI...');
    const [stream, setStream] = useState(null);
    const [overlayMsg, setOverlayMsg] = useState(null);

    useEffect(() => {
        if (isOpen && !model) {
            cocoSsd.load().then((m) => {
                setModel(m);
                setStatus('');
            }).catch(err => {
                console.error(err);
                setStatus('⚠ Gagal memuat model COCO-SSD.');
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && model) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then((s) => {
                    setStream(s);
                    if (videoRef.current) videoRef.current.srcObject = s;
                })
                .catch(() => setStatus('⚠ Tidak dapat mengakses kamera.'));
        } else {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
                setStream(null);
            }
        }
    }, [isOpen, model]);

    const detectFrame = async () => {
        if (!model || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const predictions = await model.detect(canvas);
        const vehiclePreds = predictions.filter(p => VEHICLE_MAP[p.class] && p.score > 0.4);

        if (vehiclePreds.length === 0) {
            setOverlayMsg('⚠ Tidak ada kendaraan terdeteksi.');
            return;
        }

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        vehiclePreds.forEach(p => {
            const [x, y, w, h] = p.bbox;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 16px Outfit, sans-serif';
            ctx.fillText(`${p.class} (${Math.round(p.score * 100)}%)`, x + 4, y - 6);
        });

        const best = vehiclePreds[0];
        const vehicleVal = VEHICLE_MAP[best.class];
        setOverlayMsg(`✅ Terdeteksi: ${getVehicleLabel(vehicleVal)} (${Math.round(best.score * 100)}%)`);

        onDetect(vehicleVal);
        setTimeout(() => onClose(), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 flex justify-between items-center border-b border-white/5">
                    <h3 className="text-lg font-bold text-white">Deteksi Kendaraan AI</h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 flex flex-col items-center">
                    <p className="text-sm text-slate-400 mb-4 text-center">
                        Arahkan kamera ke kendaraan. {status && <span className="text-accent">{status}</span>}
                    </p>

                    <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-inner">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                        {overlayMsg && (
                            <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md text-white text-sm font-semibold p-3 border border-white/10 rounded-xl text-center">
                                {overlayMsg}
                            </div>
                        )}
                    </div>

                    <button
                        disabled={!model || !stream}
                        onClick={detectFrame}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-primary hover:bg-indigo-600 disabled:bg-slate-700 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-primary/40 active:scale-[0.98]"
                    >
                        <Camera size={18} /> Deteksi Sekarang
                    </button>
                </div>
            </div>
        </div>
    );
}
