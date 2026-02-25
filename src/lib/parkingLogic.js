export const TARIFF = {
    mobil: { firstRate: 5000, nextRate: 4000 },
    motor: { firstRate: 2000, nextRate: 2000 },
    box: { firstRate: 7000, nextRate: 3000 },
    valet_weekday: { firstRate: 75000 + 5000, nextRate: 4000 },
    valet_weekend: { firstRate: 100000 + 5000, nextRate: 4000 },
};

export const getVehicleLabel = (type) => {
    const labels = {
        mobil: "🚗 Mobil",
        motor: "🏍️ Motor",
        box: "🚛 Box/Truk",
        valet_weekday: "🚗 Valet (WD)",
        valet_weekend: "🚗 Valet (WE)",
    };
    return labels[type] || type;
};

export const formatIDR = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

export const formatDateTime = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
};

export const buildBreakdown = ({ vehicle, entry, exit, isLostTicket = false }) => {
    const { firstRate, nextRate } = TARIFF[vehicle] || {};
    if (!firstRate) return { error: "Jenis kendaraan tidak valid." };

    const totalMinutes = Math.floor((exit.getTime() - entry.getTime()) / 60000);
    if (isNaN(totalMinutes) || totalMinutes <= 0) {
        return { error: "Jam keluar harus lebih besar dari jam masuk." };
    }

    const durHours = Math.floor(totalMinutes / 60);
    const durMins = totalMinutes % 60;
    const durDays = Math.floor(durHours / 24);
    const durHoursRem = durHours % 24;

    const additionalMinutes = Math.max(0, totalMinutes - 60);
    const additionalHours = Math.ceil(additionalMinutes / 60);
    const additionalCharge = additionalHours * nextRate;

    const hourlyRows = [];

    if (vehicle === "valet_weekday" || vehicle === "valet_weekend") {
        const valetFee = vehicle === "valet_weekday" ? 75000 : 100000;
        hourlyRows.push({ label: "Tarif Valet", unit: "1×", subtotal: valetFee });
        hourlyRows.push({ label: "Jam pertama", unit: "1 jam", subtotal: 5000 });
    } else {
        hourlyRows.push({ label: "Jam pertama", unit: "1 jam", subtotal: firstRate });
    }

    if (additionalMinutes > 0) {
        hourlyRows.push({
            label: "Sisa durasi",
            unit: `${additionalHours} jam × ${formatIDR(nextRate)}`,
            subtotal: additionalCharge,
        });
    }

    let penaltyCharge = 0;
    if (isLostTicket) {
        const fee = vehicle === 'motor' ? 25000 : 50000;
        penaltyCharge = fee;
        hourlyRows.push({
            label: "Denda Tiket Hilang",
            unit: "1×",
            subtotal: fee
        });
    }

    const totalCharge = firstRate + additionalCharge + penaltyCharge;

    return {
        totalMinutes,
        durHours, durMins, durDays, durHoursRem,
        additionalHours, additionalCharge, totalCharge, penaltyCharge,
        hourlyRows,
        methodLabel: "Per jam (dibulatkan ke atas)",
    };
};

export const saveTransaction = (breakdown, entry, exit, vehicle, plate = '', isLostTicket = false) => {
    const history = JSON.parse(localStorage.getItem('parkingHistory') || '[]');
    if (history.length >= 50) history.pop();

    const newTx = {
        id: `GCT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        vehicle,
        plate,
        isLostTicket,
        entry: entry.toISOString(),
        exit: exit.toISOString(),
        methodLabel: breakdown.methodLabel,
        duration: breakdown.durMinutes,
        total: breakdown.totalCharge,
    };

    history.unshift(newTx);
    localStorage.setItem('parkingHistory', JSON.stringify(history));
    return newTx;
};
