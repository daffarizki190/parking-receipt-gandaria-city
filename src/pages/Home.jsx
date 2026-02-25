import { useState, useEffect } from 'react';
import { Calculator, Camera, ChevronDown, ChevronUp, Info } from 'lucide-react';
import FormSection from '../components/FormSection';
import QRScanner from '../components/QRScanner';
import ReceiptSection from '../components/ReceiptSection';
import AIPrediction from '../components/AIPrediction';
import { buildBreakdown, saveTransaction, formatIDR, TARIFF } from '../lib/parkingLogic';

/* ── Live Clock ──────────────────────────────────── */
function LiveClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const pad = n => String(n).padStart(2, '0');
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return (
        <div className="glass p-4 flex items-center justify-between anim-fade-in">
            <div>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">
                    {days[time.getDay()]}, {time.getDate()} {months[time.getMonth()]} {time.getFullYear()}
                </p>
                <div className="clock-display flex items-baseline gap-0.5">
                    {pad(time.getHours())}
                    <span className="text-indigo-400 animate-pulse">:</span>
                    {pad(time.getMinutes())}
                    <span className="text-slate-400 text-lg ml-1">{pad(time.getSeconds())}</span>
                </div>
            </div>
            <div className="text-right flex flex-col items-end">
                <div className="chip chip-amber mb-1" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>WIB</div>
                <p className="text-[10px] text-slate-400 font-medium">Jakarta, ID</p>
            </div>
        </div>
    );
}

/* ── Tariff Reference ────────────────────────────── */
const TARIFF_GUIDE = [
    { emoji: '🏍️', name: 'Motor', first: TARIFF.motor.firstRate, next: TARIFF.motor.nextRate },
    { emoji: '🚗', name: 'Mobil', first: TARIFF.mobil.firstRate, next: TARIFF.mobil.nextRate },
    { emoji: '🚛', name: 'Box/Truk', first: TARIFF.box.firstRate, next: TARIFF.box.nextRate },
    { emoji: '🎖️', name: 'Valet WD', first: 75000, next: TARIFF.valet_weekday.nextRate, note: '+Rp5K/jam' },
    { emoji: '🎖️', name: 'Valet WE', first: 100000, next: TARIFF.valet_weekend.nextRate, note: '+Rp5K/jam' },
];

function TariffGuide() {
    const [open, setOpen] = useState(false);
    return (
        <div className="glass-sm overflow-hidden anim-fade-in bg-white/60">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between p-4 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
                <div className="flex items-center gap-2">
                    <Info size={16} className="text-indigo-500" />
                    Referensi Tarif Parkir
                </div>
                {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {open && (
                <div className="px-4 pb-4 anim-fade-in">
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 gap-y-2.5 text-xs items-center">
                        <div className="col-span-4 grid grid-cols-[auto_1fr_auto_auto] gap-x-3 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 pb-2 mb-1">
                            <span></span><span>Jenis</span><span className="text-right">Jam 1</span><span className="text-right">Jam+</span>
                        </div>
                        {TARIFF_GUIDE.map(t => (
                            <div key={t.name} className="col-span-4 grid grid-cols-[auto_1fr_auto_auto] gap-x-3 items-center">
                                <span className="text-base">{t.emoji}</span>
                                <div className="leading-tight">
                                    <span className="text-slate-800 font-bold">{t.name}</span>
                                    {t.note && <p className="text-[10px] text-slate-500">{t.note}</p>}
                                </div>
                                <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{formatIDR(t.first)}</span>
                                <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] font-bold">{formatIDR(t.next)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Result Card ─────────────────────────────────── */
function ResultCard({ result, onShowReceipt, onReset }) {
    const { breakdown, formatIDR: _fi } = result;
    return (
        <div className="glass anim-slide-up overflow-hidden border-indigo-100">
            {/* Top accent line */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-sky-400" />

            <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-lg text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Hasil Kalkulasi
                    </h3>
                    <div className="chip chip-green bg-emerald-100/50">✓ Selesai</div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                        { label: 'Masuk', value: new Date(result.entry).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
                        { label: 'Keluar', value: new Date(result.exit).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
                        { label: 'Durasi', value: `${breakdown.durDays > 0 ? breakdown.durDays + 'h ' : ''}${breakdown.durHoursRem}j ${breakdown.durMins}m` },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center">
                            <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-1">{label}</span>
                            <span className="text-xs font-black font-mono text-slate-700">{value}</span>
                        </div>
                    ))}
                </div>

                {/* Breakdown rows */}
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-5">
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        <span>Komponen Biaya</span><span className="text-right">Subtotal</span>
                    </div>
                    {breakdown.hourlyRows.map((r, i) => (
                        <div key={i} className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-3 border-b border-slate-100 last:border-0 items-center">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">{r.label}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{r.unit}</p>
                            </div>
                            <span className="font-mono text-sm font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md">{formatIDR(r.subtotal)}</span>
                        </div>
                    ))}
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-4 bg-indigo-50/50 border-t border-indigo-100 items-center">
                        <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">Total Bayar</span>
                        <span className="total-amount drop-shadow-sm">
                            {formatIDR(breakdown.totalCharge)}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={onReset} className="btn-secondary flex-1 text-sm py-3.5 shadow-sm">Hitung Lagi</button>
                    <button onClick={onShowReceipt} className="btn-primary flex-[2] text-sm py-3.5 flex items-center justify-center gap-2">
                        📄 Form Resi & Bayar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main Page ───────────────────────────────────── */
export default function Home() {
    const [activeTab, setActiveTab] = useState('kalkulator');
    const [scannedData, setScannedData] = useState(null);
    const [result, setResult] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const handleFormSubmit = ({ vehicle, entry, exit }) => {
        const breakdown = buildBreakdown({ vehicle, entry, exit });
        if (breakdown.error) { alert(breakdown.error); return; }
        saveTransaction(breakdown, entry, exit, vehicle);
        setResult({ breakdown, entry, exit, vehicle });
        setShowReceipt(false);
    };

    const handleScanSuccess = (data) => {
        setScannedData(data);
        setTimeout(() => setActiveTab('kalkulator'), 800);
    };

    if (showReceipt && result) {
        return <ReceiptSection data={result} onClose={() => setShowReceipt(false)} />;
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Live Clock */}
            <LiveClock />

            {/* AI Prediction */}
            <AIPrediction />

            {/* Tab Nav */}
            <div className="flex bg-slate-200/50 p-1 rounded-[14px] shadow-inner-soft backdrop-blur-md">
                <button onClick={() => setActiveTab('kalkulator')} className={`nav-tab ${activeTab === 'kalkulator' ? 'active' : ''}`}>
                    <Calculator size={14} /> Kalkulator
                </button>
                <button onClick={() => setActiveTab('scanner')} className={`nav-tab ${activeTab === 'scanner' ? 'active' : ''}`}>
                    <Camera size={14} /> Scan Tiket
                </button>
            </div>

            {/* Content */}
            {activeTab === 'kalkulator' ? (
                <FormSection key={JSON.stringify(scannedData)} initialData={scannedData} onSubmit={handleFormSubmit} />
            ) : (
                <QRScanner onScanSuccess={handleScanSuccess} />
            )}

            {/* Results */}
            {result && activeTab === 'kalkulator' && (
                <ResultCard
                    result={result}
                    onShowReceipt={() => setShowReceipt(true)}
                    onReset={() => setResult(null)}
                />
            )}

            {/* Tariff Guide */}
            <TariffGuide />
        </div>
    );
}
