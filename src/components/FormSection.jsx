import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import CameraModal from './CameraModal';
import VoiceCommand from './VoiceCommand';
import AIPrediction from './AIPrediction';

const toLocalISO = (date) => {
    if (!date) return '';
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date - tzOffset).toISOString().slice(0, 16);
};

export default function FormSection({ initialData, onSubmit }) {
    const [vehicle, setVehicle] = useState('mobil');
    const [entryTime, setEntryTime] = useState('');
    const [exitTime, setExitTime] = useState('');
    const [cameraOpen, setCameraOpen] = useState(false);

    useEffect(() => {
        if (initialData) {
            setVehicle(initialData.v || 'mobil');
            if (initialData.e) setEntryTime(toLocalISO(new Date(initialData.e)));
            if (!initialData.x) setExitTime(toLocalISO(new Date()));
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (!vehicle || !entryTime || !exitTime) return;

        onSubmit({
            vehicle,
            entry: new Date(entryTime),
            exit: new Date(exitTime)
        });
    };

    const handleVoiceCommand = ({ vehicle: v, time, isExit }) => {
        if (v) setVehicle(v);
        if (time) {
            if (isExit) setExitTime(toLocalISO(time));
            else setEntryTime(toLocalISO(time));
        }
    };

    return (
        <>
            <div className="glass-card flex flex-col p-6 rounded-3xl animate-in fade-in zoom-in-95 duration-300">
                <AIPrediction />

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Formulir Pengecekan</h2>
                    <div className="flex gap-2">
                        <VoiceCommand onCommand={handleVoiceCommand} />
                        <button
                            type="button"
                            onClick={() => setCameraOpen(true)}
                            className="w-10 h-10 rounded-xl bg-white/5 text-accent border border-white/10 flex items-center justify-center hover:bg-accent/10 hover:border-accent/40 transition-colors"
                            title="Deteksi AI Kendaraan"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-300">Jenis Kendaraan</label>
                        <div className="relative">
                            <select
                                value={vehicle}
                                onChange={e => setVehicle(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 text-white text-base rounded-xl px-4 py-3.5 appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                            >
                                <option value="mobil" className="bg-secondary text-white">🚗 Mobil</option>
                                <option value="motor" className="bg-secondary text-white">🏍️ Motor</option>
                                <option value="box" className="bg-secondary text-white">🚛 Box / Truk</option>
                                <option value="valet_weekday" className="bg-secondary text-white">🎖️ Valet Weekday</option>
                                <option value="valet_weekend" className="bg-secondary text-white">🎖️ Valet Weekend</option>
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-300">Jam Masuk</label>
                        <input
                            type="datetime-local"
                            value={entryTime}
                            onChange={e => setEntryTime(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 text-white text-base rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-slate-500 [color-scheme:dark]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-300">Jam Keluar</label>
                        <input
                            type="datetime-local"
                            value={exitTime}
                            onChange={e => setExitTime(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 text-white text-base rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-slate-500 [color-scheme:dark]"
                        />
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => { setVehicle('mobil'); setEntryTime(''); setExitTime(''); }}
                            className="flex-shrink-0 w-24 py-3.5 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-semibold bg-primary hover:bg-indigo-600 shadow-lg shadow-primary/30 text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Calculator size={18} /> Hitung Tarif
                        </button>
                    </div>
                </form>
            </div>

            <CameraModal
                isOpen={cameraOpen}
                onClose={() => setCameraOpen(false)}
                onDetect={(v) => setVehicle(v)}
            />
        </>
    );
}
