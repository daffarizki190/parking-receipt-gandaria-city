import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { Share2, Download, X } from 'lucide-react';
import { formatIDR, formatDateTime, getVehicleLabel } from '../lib/parkingLogic';

export default function ReceiptSection({ data, onClose }) {
    const qrCanvasRef = useRef(null);
    const receiptRef = useRef(null);
    const [receiptId] = useState(() => {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `PKR-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    });

    useEffect(() => {
        if (data && qrCanvasRef.current) {
            const payload = JSON.stringify({
                v: data.vehicle,
                e: data.entry.toISOString(),
                x: data.exit.toISOString(),
                t: data.breakdown.totalCharge,
            });

            QRCode.toCanvas(qrCanvasRef.current, payload, {
                width: 140,
                margin: 1,
                color: { dark: '#0f172a', light: '#ffffff' }
            });
        }
    }, [data]);

    const handleShareWA = () => {
        const msg = `*Resi Parkir Gandaria City*\nNo. Resi : ${receiptId}\nKendaraan: ${getVehicleLabel(data.vehicle)}\nMasuk    : ${formatDateTime(data.entry)}\nKeluar   : ${formatDateTime(data.exit)}\nDurasi   : ${data.breakdown.durDays}h ${data.breakdown.durHoursRem}j ${data.breakdown.durMins}m\n─────────────────────────\n*Total Bayar: ${formatIDR(data.breakdown.totalCharge)}*`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleDownloadIMG = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#1e1b4b', scale: 2, useCORS: true });
            const link = document.createElement('a');
            link.download = `resi-${receiptId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            alert('Gagal mendownload gambar.');
        }
    };

    if (!data) return null;

    return (
        <div className="glass-card flex flex-col rounded-3xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-4 sm:p-6 pb-0 flex justify-between items-center bg-white/5 border-b border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    🧾 Resi Pembayaran
                </h2>
                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="p-4 sm:p-6" ref={receiptRef}>
                <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4">
                    <div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">No. Resi</div>
                        <div className="font-mono font-bold text-sm tracking-wide text-white">{receiptId}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">Tanggal Cetak</div>
                        <div className="font-mono font-medium text-xs text-slate-300">{formatDateTime(new Date())}</div>
                    </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-3 mb-6 relative">
                    <div className="text-xs text-slate-400 font-medium">Kendaraan</div>
                    <div className="text-sm font-semibold text-white">{getVehicleLabel(data.vehicle)}</div>

                    <div className="text-xs text-slate-400 font-medium">Masuk</div>
                    <div className="text-xs font-mono text-slate-200">{formatDateTime(data.entry)}</div>

                    <div className="text-xs text-slate-400 font-medium">Keluar</div>
                    <div className="text-xs font-mono text-slate-200">{formatDateTime(data.exit)}</div>

                    <div className="text-xs text-slate-400 font-medium">Durasi</div>
                    <div className="text-sm font-semibold text-accent">{data.breakdown.durDays}h {data.breakdown.durHoursRem}j {data.breakdown.durMins}m</div>
                </div>

                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    {data.breakdown.hourlyRows.map((r, i) => (
                        <div key={i} className="flex justify-between items-center mb-2 last:mb-0">
                            <div className="flex flex-col">
                                <span className="text-sm text-slate-200 font-medium">{r.label}</span>
                                <span className="text-[10px] text-slate-400">{r.unit}</span>
                            </div>
                            <div className="font-mono text-sm text-slate-300">{formatIDR(r.subtotal)}</div>
                        </div>
                    ))}

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">
                        <span className="text-sm font-bold text-white uppercase tracking-wider">Total</span>
                        <span className="font-mono text-xl font-bold text-accent">{formatIDR(data.breakdown.totalCharge)}</span>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-dashed border-white/20 flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mb-3">Tiket Masuk QR</span>
                    <div className="p-1 bg-white rounded-xl">
                        <canvas ref={qrCanvasRef} className="rounded-lg block w-[140px] h-[140px]" style={{ imageRendering: 'pixelated' }} />
                    </div>
                    <span className="text-xs text-slate-500 mt-3 font-medium">Simpan untuk scan saat keluar</span>
                </div>
            </div>

            <div className="p-4 sm:p-6 pt-0 flex gap-3">
                <button
                    onClick={handleShareWA}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#25d366]/20 text-[#25d366] border border-[#25d366]/40 rounded-xl font-semibold hover:bg-[#25d366]/30 transition-colors"
                >
                    <Share2 size={16} /> WhatsApp
                </button>
                <button
                    onClick={handleDownloadIMG}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-accent/20 text-accent border border-accent/40 rounded-xl font-semibold hover:bg-accent/30 transition-colors"
                >
                    <Download size={16} /> Simpan Gambar
                </button>
            </div>
        </div>
    );
}
