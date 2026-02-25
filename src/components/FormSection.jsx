import { useState, useEffect } from 'react';
import { Mic, Camera, Calculator, ChevronRight } from 'lucide-react';
import { TARIFF, formatIDR } from '../lib/parkingLogic';
import VoiceCommand from './VoiceCommand';
import CameraModal from './CameraModal';

const VEHICLES = [
    { key: 'motor', emoji: '🏍️', name: 'Motor', rate: `${formatIDR(TARIFF.motor.firstRate)}/jam` },
    { key: 'mobil', emoji: '🚗', name: 'Mobil', rate: `${formatIDR(TARIFF.mobil.firstRate)}/jam` },
    { key: 'box', emoji: '🚛', name: 'Box/Truk', rate: `${formatIDR(TARIFF.box.firstRate)}/jam` },
    { key: 'valet_weekday', emoji: '🎖️', name: 'Valet WD', rate: `${formatIDR(75000)}+/trip` },
    { key: 'valet_weekend', emoji: '🎖️', name: 'Valet WE', rate: `${formatIDR(100000)}+/trip` },
];

const toDatetimeLocal = (date) => {
    if (!date) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function FormSection({ initialData, onSubmit }) {
    const [vehicle, setVehicle] = useState(initialData?.vehicle || '');
    const [entryTime, setEntryTime] = useState(initialData?.entry ? toDatetimeLocal(new Date(initialData.entry)) : '');
    const [exitTime, setExitTime] = useState('');
    const [showVoice, setShowVoice] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [loading, setLoading] = useState(false);

    // Auto-fill "now" as exit
    useEffect(() => {
        setExitTime(toDatetimeLocal(new Date()));
    }, []);

    // Apply scanned data
    useEffect(() => {
        if (initialData) {
            if (initialData.vehicle) setVehicle(initialData.vehicle);
            if (initialData.entry) setEntryTime(toDatetimeLocal(new Date(initialData.entry)));
        }
    }, [initialData]);

    const handleVehicleDetected = (v) => {
        setVehicle(v);
        setShowCamera(false);
    };
    const handleVoiceFill = ({ vehicle: v, entryTime: e, exitTime: x }) => {
        if (v) setVehicle(v);
        if (e) setEntryTime(e);
        if (x) setExitTime(x);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!vehicle || !entryTime || !exitTime) return;
        setLoading(true);
        setTimeout(() => {
            onSubmit({ vehicle, entry: new Date(entryTime), exit: new Date(exitTime) });
            setLoading(false);
        }, 600);
    };

    return (
        <>
            <div className="glass anim-slide-up p-5 sm:p-7 flex flex-col gap-6">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-xl text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.5px' }}>
                            Detail Booking
                        </h2>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5 tracking-wide">Lengkapi data kendaraan untuk kalkulasi</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowVoice(v => !v)} className="btn-icon bg-indigo-50 text-indigo-600 border-indigo-100" title="Perintah suara">
                            <Mic size={16} />
                        </button>
                        <button onClick={() => setShowCamera(true)} className="btn-icon bg-sky-50 text-sky-600 border-sky-100" title="Deteksi AI kamera">
                            <Camera size={16} />
                        </button>
                    </div>
                </div>

                {/* Voice Panel */}
                {showVoice && (
                    <div className="anim-fade-in bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <VoiceCommand onFill={handleVoiceFill} onClose={() => setShowVoice(false)} />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Vehicle Picker */}
                    <div>
                        <div className="form-label flex items-center gap-1.5 mb-2">
                            <Calculator size={12} className="text-indigo-400" /> Kategori Kendaraan
                        </div>
                        <div className="vehicle-grid">
                            {VEHICLES.map(v => (
                                <button
                                    key={v.key}
                                    type="button"
                                    onClick={() => setVehicle(v.key)}
                                    className={`vehicle-card ${vehicle === v.key ? 'active' : ''}`}
                                >
                                    <span className="vehicle-emoji">{v.emoji}</span>
                                    <span className="vehicle-name">{v.name}</span>
                                    <span className="vehicle-rate">{v.rate}</span>
                                </button>
                            ))}
                        </div>
                        {!vehicle && (
                            <p className="text-[10px] text-amber-600 font-medium mt-2 ml-1 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Pilih satu kategori di atas
                            </p>
                        )}
                    </div>

                    {/* Time Inputs */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="form-group">
                            <label className="form-label text-[10px] ml-1">Jam Kedatangan</label>
                            <input
                                type="datetime-local"
                                value={entryTime}
                                onChange={e => setEntryTime(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label text-[10px] ml-1">Jam Keluar (Estimasi)</label>
                            <input
                                type="datetime-local"
                                value={exitTime}
                                onChange={e => setExitTime(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !vehicle}
                        className="btn-primary w-full flex items-center justify-center gap-2 text-sm uppercase tracking-wide py-4 mt-2"
                        style={{ opacity: (!vehicle ? 0.6 : 1) }}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/80 border-t-white rounded-full animate-spin" />
                                Menghitung Tagihan...
                            </>
                        ) : (
                            <>
                                Kalkulasi Tagihan
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <CameraModal
                    onDetected={handleVehicleDetected}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </>
    );
}
