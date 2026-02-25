import { useEffect, useRef, useState } from 'react';
import { formatIDR, formatDateTime, getVehicleLabel } from '../lib/parkingLogic';
import { Share2, Image, X } from 'lucide-react';

/* ── Confetti ─────────────────────────────────────────────────── */
function launchConfetti() {
    const colors = ['#4f46e5', '#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b'];
    for (let i = 0; i < 40; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.width = (Math.random() * 8 + 5) + 'px';
        el.style.height = (Math.random() * 8 + 5) + 'px';
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        el.style.animationDuration = (Math.random() * 2 + 2) + 's';
        el.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }
}

/* ── Count-Up Hook ────────────────────────────────────────────── */
function useCountUp(target, duration = 1200) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        const start = Date.now();
        const frame = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            if (progress < 1) {
                setValue(Math.round(target * ease));
                requestAnimationFrame(frame);
            } else {
                setValue(target);
            }
        };
        requestAnimationFrame(frame);
    }, [target, duration]);
    return value;
}

/* ── Formatted Count-Up ───────────────────────────────────────── */
function AnimatedTotal({ total }) {
    const animated = useCountUp(total);
    return <span className="total-amount drop-shadow-sm">{formatIDR(animated)}</span>;
}

/* ── Receipt ID Generator ─────────────────────────────────────── */
const makeId = () => {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `GCT-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
};

export default function ReceiptSection({ data, onClose }) {
    const { breakdown, entry, exit, vehicle, plate, isLostTicket } = data;
    const receiptId = useRef(makeId()).current;
    const printRef = useRef(null);
    const printedAt = new Date();

    useEffect(() => {
        launchConfetti();
    }, []);

    const shareWA = () => {
        const _plate = plate ? `Plat No  : ${plate}\n` : '';
        const _status = isLostTicket ? `Status   : Hilang Tiket (Denda)\n` : '';
        const msg =
            `*PARKMATE GANDARIA CITY*\n` +
            `========================\n` +
            `ID Trans : ${receiptId}\n` +
            `Kendaraan: ${getVehicleLabel(vehicle)}\n` +
            _plate +
            _status +
            `Masuk    : ${formatDateTime(entry)}\n` +
            `Keluar   : ${formatDateTime(exit)}\n` +
            `Durasi   : ${breakdown.durDays}h ${breakdown.durHoursRem}j ${breakdown.durMins}m\n` +
            `------------------------\n` +
            `*TOTAL: ${formatIDR(breakdown.totalCharge)}*`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const saveImage = async () => {
        if (typeof html2canvas === 'undefined') { alert('Library penangkap layar belum dimuat.'); return; }
        const canvas = await html2canvas(printRef.current, { backgroundColor: '#f8fafc', scale: 2, useCORS: true });
        const a = document.createElement('a');
        a.download = `resi-${receiptId}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
    };

    return (
        <div className="flex flex-col gap-4 anim-slide-up pb-8">
            {/* Elegant Print Card */}
            <div ref={printRef} className="receipt-card p-6 bg-white">

                {/* Header Text */}
                <div className="text-center mb-6">
                    <p className="text-[10px] font-black tracking-[0.3em] text-indigo-600 mb-1">PARKMATE</p>
                    <p className="text-[9px] font-medium tracking-widest text-slate-400 uppercase">GANDARIA CITY</p>
                    <div className="receipt-dots justify-center mt-4">
                        {Array.from({ length: 12 }).map((_, i) => <span key={i} />)}
                    </div>
                </div>

                {/* ID & Time */}
                <div className="flex justify-between items-baseline mb-5 text-[10px]">
                    <div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest mb-0.5">ID Trans. (E-Money)</p>
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{receiptId}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 font-bold uppercase tracking-widest mb-0.5">Cetak</p>
                        <p className="font-mono text-slate-500 dark:text-slate-400">{formatDateTime(printedAt)}</p>
                    </div>
                </div>

                {/* Vehicle & Core Dates */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 mb-5">
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-xs">
                        {[
                            { label: 'Tipe', value: getVehicleLabel(vehicle) },
                            ...(isLostTicket ? [{ label: 'Status', value: 'LOST TIKET', special: true, alert: true }] : []),
                            ...(plate ? [{ label: 'Plat', value: plate, mono: true, special: true }] : []),
                            { label: 'Masuk', value: formatDateTime(entry), mono: true },
                            { label: 'Keluar', value: formatDateTime(exit), mono: true },
                            { label: 'Dur', value: `${breakdown.durDays}h ${breakdown.durHoursRem}j ${breakdown.durMins}m` },
                        ].map(({ label, value, mono, special, alert }) => (
                            <div key={label} className="contents">
                                <span className="text-slate-400 font-semibold tracking-wider uppercase text-[10px] self-center">{label}</span>
                                <span className={alert ? 'font-mono font-black text-rose-500 tracking-widest text-right text-[11px] bg-rose-50 dark:bg-rose-500/20 px-1 py-0.5 rounded' : special ? 'font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-widest text-right text-sm' : `text-slate-800 dark:text-slate-200 font-medium ${mono ? 'font-mono text-[11px]' : ''} text-right`}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Breakdown List */}
                <div className="mb-6">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 mb-2 text-slate-400 uppercase tracking-widest font-bold text-[9px] px-1">
                        <span>Items</span><span>Volume</span><span className="text-right">RP</span>
                    </div>
                    {breakdown.hourlyRows.map((r, i) => (
                        <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-x-3 py-1.5 items-center px-1">
                            <span className="text-slate-700 dark:text-slate-300 text-xs font-semibold">{r.label}</span>
                            <span className="text-slate-400 font-mono text-[10px]">{r.unit}</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm text-right">{formatIDR(r.subtotal)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-5 text-center mt-2 relative">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase mb-1">Total Tagihan</p>
                    <AnimatedTotal total={breakdown.totalCharge} />
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-2">Dibulatkan Ke Atas ({breakdown.methodLabel})</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
                <button onClick={onClose} className="btn-secondary flex flex-col items-center gap-1.5 py-3 px-2 text-[11px] uppercase tracking-wider font-bold">
                    <X size={15} /> Tutup
                </button>
                <button onClick={shareWA} className="btn-icon bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 flex flex-col items-center gap-1.5 py-3 px-2 text-[11px] uppercase tracking-wider font-bold w-full justify-center shadow-none"
                    style={{ borderRadius: '14px' }}>
                    <Share2 size={15} /> Kirim
                </button>
                <button onClick={saveImage} className="btn-icon bg-sky-50 border-sky-100 text-sky-600 hover:bg-sky-100 hover:text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400 flex flex-col items-center gap-1.5 py-3 px-2 text-[11px] uppercase tracking-wider font-bold w-full justify-center shadow-none"
                    style={{ borderRadius: '14px' }}>
                    <Image size={15} /> Simpan
                </button>
            </div>
        </div>
    );
}
