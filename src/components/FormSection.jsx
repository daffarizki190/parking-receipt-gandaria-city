import { useState, useEffect } from 'react';
import { Mic, Camera, Calculator, ChevronRight, FileText } from 'lucide-react';
import { TARIFF, formatIDR } from '../lib/parkingLogic';
import VoiceCommand from './VoiceCommand';
import CameraModal from './CameraModal';
import PlateScanner from './PlateScanner';

const VEHICLES = [
    { key: 'motor', emoji: '🏍️', name: 'Motor', rate: `${formatIDR(TARIFF.motor.firstRate)}/jam` },
    { key: 'mobil', emoji: '🚗', name: 'Mobil', rate: `${formatIDR(TARIFF.mobil.firstRate)}/jam` },
    { key: 'box', emoji: '🚛', name: 'Box/Truk', rate: `${formatIDR(TARIFF.box.firstRate)}/jam` },
    { key: 'valet_weekday', emoji: '🚗', name: 'Valet WD', rate: `${formatIDR(75000)}+/trip` },
    { key: 'valet_weekend', emoji: '🚗', name: 'Valet WE', rate: `${formatIDR(100000)}+/trip` },
];

const toDatetimeLocal = (date) => {
    if (!date) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function FormSection({ initialData, onSubmit }) {
    const [vehicle, setVehicle] = useState(initialData?.vehicle || '');
    const [plate, setPlate] = useState(initialData?.plate || '');
    const [entryTime, setEntryTime] = useState(initialData?.entry ? toDatetimeLocal(new Date(initialData.entry)) : '');
    const [exitTime, setExitTime] = useState('');
    const [isLostTicket, setIsLostTicket] = useState(initialData?.isLostTicket || false);
    const [showVoice, setShowVoice] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [showPlateScanner, setShowPlateScanner] = useState(false);

    // Auto-fill "now" as entry and exit times by default
    useEffect(() => {
        const now = toDatetimeLocal(new Date());
        if (!initialData?.entry) setEntryTime(now);
        setExitTime(now);
    }, [initialData]);

    // Apply scanned data
    useEffect(() => {
        if (initialData) {
            if (initialData.vehicle) setVehicle(initialData.vehicle);
            if (initialData.plate) setPlate(initialData.plate);
            if (initialData.entry) setEntryTime(toDatetimeLocal(new Date(initialData.entry)));
            if (initialData.isLostTicket !== undefined) setIsLostTicket(initialData.isLostTicket);
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
        onSubmit({ vehicle, plate, entry: new Date(entryTime), exit: new Date(exitTime), isLostTicket });
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

                    {/* Jenis Transaksi */}
                    <div>
                        <div className="form-label flex items-center gap-1.5 mb-2">
                            <FileText size={12} className="text-indigo-400" /> Jenis Transaksi
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`relative flex items-center justify-center gap-2 p-3 sm:py-3.5 rounded-xl border cursor-pointer transition-all ${!isLostTicket ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-200 bg-slate-50 opacity-60 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50'}`}>
                                <input type="radio" name="ticket_type" className="hidden" checked={!isLostTicket} onChange={() => setIsLostTicket(false)} />
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Casual</span>
                            </label>
                            <label className={`relative flex items-center justify-center gap-2 p-3 sm:py-3.5 rounded-xl border cursor-pointer transition-all ${isLostTicket ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-500/10' : 'border-slate-200 bg-slate-50 opacity-60 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50'}`}>
                                <input type="radio" name="ticket_type" className="hidden" checked={isLostTicket} onChange={() => setIsLostTicket(true)} />
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">Lost Tiket <span className="text-[9px] bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">+Denda</span></span>
                            </label>
                        </div>
                    </div>

                    {/* License Plate Input */}
                    <div className="form-group relative">
                        <label className="form-label mb-1">
                            Plat Nomor <span className="opacity-60">(Opsional)</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="B 1234 GCT"
                                value={plate}
                                onChange={e => setPlate(e.target.value.toUpperCase())}
                                className="form-input pr-12 font-mono uppercase tracking-widest text-lg sm:text-base py-3 sm:py-2.5"
                                style={{
                                    backgroundImage: plate ? "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E\")" : "none",
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'calc(100% - 45px) center',
                                    backgroundSize: '16px'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPlateScanner(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-all active:scale-95 border border-indigo-100/50 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-400"
                                title="Scan Plat Nomor"
                            >
                                <Camera size={16} />
                            </button>
                        </div>
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
                        disabled={!vehicle}
                        className="btn-primary w-full flex items-center justify-center gap-2 text-sm uppercase tracking-wide py-4 mt-2"
                        style={{ opacity: (!vehicle ? 0.6 : 1) }}
                    >
                        Kalkulasi Tagihan
                        <ChevronRight size={16} />
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

            {/* Plate Scanner Modal */}
            {showPlateScanner && (
                <PlateScanner
                    onDetected={(plateStr) => {
                        setPlate(plateStr);
                        setShowPlateScanner(false);
                    }}
                    onClose={() => setShowPlateScanner(false)}
                />
            )}
        </>
    );
}
