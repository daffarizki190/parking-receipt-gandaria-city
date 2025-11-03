function formatIDR(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDateTime(dt) {
  const d = new Date(dt);
  const tgl = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  const jam = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${tgl} ${jam} WIB`;
}

function calcDurationMinutes(start, end) {
  const ms = end - start;
  return Math.floor(ms / 60000);
}

// Perbarui: dukung beberapa metode perhitungan untuk kejelasan
function buildBreakdown({ firstRate, nextRate, entry, exit, method, vehicle }) {
  const totalMinutes = calcDurationMinutes(entry, exit);
  if (isNaN(totalMinutes) || totalMinutes <= 0) {
    return { error: "Jam keluar harus lebih besar dari jam masuk." };
  }

  const durHours = Math.floor(totalMinutes / 60);
  const durMins = totalMinutes % 60;
  const durDays = Math.floor(durHours / 24);
  const durHoursRem = durHours % 24;

  const firstHourCharge = firstRate;
  const additionalMinutes = Math.max(0, totalMinutes - 60);

  let units = 0;
  let unitPrice = 0;
  let additionalCharge = 0;
  let methodLabel = "";
  let formula = "";
  let unitLabel = "";

  if (method === "hourly") {
    units = Math.max(0, durHours - 1);
    unitPrice = nextRate;
    additionalCharge = units * unitPrice;
    methodLabel = "Per jam";
    formula = `${formatIDR(firstRate)} + (${units} × ${formatIDR(nextRate)})`;
    unitLabel = "jam";
  } else if (method === "half_hour") {
    const halfHours = Math.max(0, Math.ceil(additionalMinutes / 30));
    units = halfHours;
    unitPrice = nextRate;
    additionalCharge = units * unitPrice;
    methodLabel = "Per 30 menit";
    formula = `${formatIDR(firstRate)} + (${units} × ${formatIDR(nextRate)})`;
    unitLabel = "30 menit";
  } else if (method === "per_minute") {
    units = additionalMinutes;
    unitPrice = nextRate;
    additionalCharge = units * unitPrice;
    methodLabel = "Per menit";
    formula = `${formatIDR(firstRate)} + (${units} × ${formatIDR(nextRate)})`;
    unitLabel = "menit";
  }

  const totalCharge = firstHourCharge + additionalCharge;

  const hourlyRows = [];
  hourlyRows.push({
    label: "Jam pertama",
    unit: "1 jam",
    subtotal: firstHourCharge,
  });
  if (units > 0) {
    hourlyRows.push({
      label: `Tambahan (${units} ${unitLabel})`,
      unit: `${units} ${unitLabel}`,
      subtotal: additionalCharge,
    });
  }

  return {
    totalMinutes,
    durHours,
    durMins,
    firstHourCharge,
    additionalMinutes,
    units,
    unitPrice,
    additionalCharge,
    totalCharge,
    hourlyRows,
    explanation: `Perhitungan menggunakan metode ${methodLabel.toLowerCase()}.`,
    methodLabel,
    formula,
  };
}

// Perbarui tampilan breakdown agar menyertakan metode dan formula
function renderBreakdown(container, data, ctx) {
  const { entry, exit, method } = ctx;
  const durDays = Math.floor(data.durHours / 24);
  const durHoursRem = data.durHours % 24;

  let durationText = "";
  if (durDays > 0) {
    durationText = `${durDays} hari ${durHoursRem} jam ${data.durMins} menit`;
  } else {
    durationText = `${data.durHours} jam ${data.durMins} menit`;
  }

  const rows = data.hourlyRows
    .map(
      (row) =>
        `<tr><td>${row.label}</td><td>${row.unit}</td><td>${formatIDR(row.subtotal)}</td></tr>`,
    )
    .join("");

  container.innerHTML = `
    <div class="breakdown-header">
      <h3>Detail Perhitungan</h3>
      <p><strong>Metode:</strong> ${data.methodLabel}</p>
      <p><strong>Formula:</strong> ${data.formula}</p>
    </div>
    <div class="time-info">
      <p><strong>Masuk:</strong> ${formatDateTime(entry)}</p>
      <p><strong>Keluar:</strong> ${formatDateTime(exit)}</p>
      <p><strong>Durasi:</strong> ${durationText}</p>
    </div>
    <table class="breakdown-table">
      <thead>
        <tr><th>Komponen</th><th>Unit</th><th>Subtotal</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="2"><strong>Total Tarif</strong></td>
          <td><strong>${formatIDR(data.totalCharge)}</strong></td>
        </tr>
      </tfoot>
    </table>
    <p class="explanation">${data.explanation}</p>
  `;
}

function buildReceipt({ breakdown, entry, exit }) {
  const durDays = Math.floor(breakdown.durHours / 24);
  const durHoursRem = breakdown.durHours % 24;

  let durationText = "";
  if (durDays > 0) {
    durationText = `${durDays} hari ${durHoursRem} jam ${breakdown.durMins} menit`;
  } else {
    durationText = `${breakdown.durHours} jam ${breakdown.durMins} menit`;
  }

  const rows = breakdown.hourlyRows
    .map(
      (row) =>
        `<tr><td>${row.label}</td><td>${formatIDR(row.subtotal)}</td></tr>`,
    )
    .join("");

  return `
    <div class="receipt-header">
      <h2>🅿️ RESI PARKIR</h2>
      <h3>Gandaria City Mall</h3>
      <p>Jl. Sultan Iskandar Muda, Jakarta Selatan</p>
    </div>
    
    <div class="receipt-details">
      <div class="detail-row">
        <span>Masuk:</span>
        <span>${formatDateTime(entry)}</span>
      </div>
      <div class="detail-row">
        <span>Keluar:</span>
        <span>${formatDateTime(exit)}</span>
      </div>
      <div class="detail-row">
        <span>Durasi:</span>
        <span>${durationText}</span>
      </div>
      <div class="detail-row">
        <span>Metode:</span>
        <span>${breakdown.methodLabel}</span>
      </div>
    </div>

    <table class="receipt-breakdown">
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr class="total">
          <td><strong>TOTAL BAYAR</strong></td>
          <td><strong>${formatIDR(breakdown.totalCharge)}</strong></td>
        </tr>
      </tfoot>
    </table>

    <div class="receipt-footer">
      <p>Terima kasih atas kunjungan Anda</p>
      <p>Simpan resi ini sebagai bukti pembayaran</p>
    </div>
  `;
}

function saveTransactionHistory(breakdown, entry, exit, vehicle) {
  const transaction = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    vehicle: getVehicleLabel(vehicle),
    entry: entry.toISOString(),
    exit: exit.toISOString(),
    duration: `${breakdown.durHours}j ${breakdown.durMins}m`,
    method: breakdown.methodLabel,
    total: breakdown.totalCharge,
    breakdown: breakdown,
  };

  const history = getTransactionHistory();
  history.unshift(transaction);

  // Batasi riwayat maksimal 50 transaksi
  if (history.length > 50) {
    history.splice(50);
  }

  localStorage.setItem("parkingHistory", JSON.stringify(history));
}

function getTransactionHistory() {
  const stored = localStorage.getItem("parkingHistory");
  return stored ? JSON.parse(stored) : [];
}

function renderTransactionHistory(container) {
  const history = getTransactionHistory();

  if (history.length === 0) {
    container.innerHTML =
      '<p class="no-history">Belum ada riwayat transaksi</p>';
    return;
  }

  const rows = history
    .map(
      (transaction) => `
    <tr onclick="showTransactionDetails('${transaction.id}')" style="cursor: pointer;">
      <td>${new Date(transaction.timestamp).toLocaleDateString("id-ID")}</td>
      <td>${transaction.vehicle}</td>
      <td>${transaction.duration}</td>
      <td>${transaction.method}</td>
      <td>${formatIDR(transaction.total)}</td>
    </tr>
  `,
    )
    .join("");

  container.innerHTML = `
    <div class="history-header">
      <h3>Riwayat Transaksi</h3>
      <button onclick="clearTransactionHistory()" class="clear-history-btn">Hapus Semua</button>
    </div>
    <div class="history-table-container">
      <table class="history-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Kendaraan</th>
            <th>Durasi</th>
            <th>Metode</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    <p class="history-note">Klik baris untuk melihat detail transaksi</p>
  `;
}

function showTransactionDetails(transactionId) {
  const history = getTransactionHistory();
  const transaction = history.find((t) => t.id === transactionId);

  if (!transaction) {
    alert("Transaksi tidak ditemukan");
    return;
  }

  const entry = new Date(transaction.entry);
  const exit = new Date(transaction.exit);
  const receipt = buildReceipt({
    breakdown: transaction.breakdown,
    entry,
    exit,
  });

  // Buat modal untuk menampilkan detail
  const modal = document.createElement("div");
  modal.className = "transaction-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Detail Transaksi</h3>
        <button class="close-modal" onclick="this.closest('.transaction-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        ${receipt}
      </div>
      <div class="modal-actions">
        <button onclick="printTransactionReceipt('${transactionId}')" class="print-btn">Print</button>
        <button onclick="this.closest('.transaction-modal').remove()" class="close-btn">Tutup</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function openPrintPreview() {
  const receiptHtml = document.getElementById("receipt").innerHTML;
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html><head><title>Print Resi</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .receipt-header { text-align: center; margin-bottom: 20px; }
      .receipt-details { margin: 20px 0; }
      .detail-row { display: flex; justify-content: space-between; margin: 5px 0; }
      .receipt-breakdown { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .receipt-breakdown td { padding: 8px; border-bottom: 1px solid #ddd; }
      .total td { font-weight: bold; border-top: 2px solid #333; }
      .receipt-footer { text-align: center; margin-top: 20px; font-size: 0.9em; }
    </style>
    </head><body>${receiptHtml}</body></html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function onSubmit(evt) {
  evt.preventDefault();

  const vehicleType = document.getElementById("vehicleType").value;
  const { firstRate, nextRate, method, vehicle } = getVehicleRates(vehicleType);

  const entryVal = document.getElementById("entryTime").value;
  const exitVal = document.getElementById("exitTime").value;

  if (!(entryVal && exitVal)) return;

  const entry = new Date(entryVal);
  const exit = new Date(exitVal);

  const breakdown = buildBreakdown({
    firstRate,
    nextRate,
    entry,
    exit,
    method,
    vehicle,
  });
  const resultSection = document.getElementById("resultSection");
  const receiptSection = document.getElementById("receiptSection");
  const breakdownContainer = document.getElementById("breakdown");
  const receiptContainer = document.getElementById("receipt");

  if (breakdown.error) {
    resultSection.classList.add("hidden");
    receiptSection.classList.add("hidden");
    alert(breakdown.error);
    return;
  }

  renderBreakdown(breakdownContainer, breakdown, { entry, exit, method });
  resultSection.classList.remove("hidden");

  window.__lastReceiptData = { breakdown, entry, exit };
  receiptSection.classList.add("hidden");
  receiptContainer.innerHTML = "";

  saveTransactionHistory(breakdown, entry, exit, vehicle);

  const actionsSection = document.getElementById("actionsSection");
  if (actionsSection) actionsSection.classList.remove("hidden");
}

function onReset() {
  document.getElementById("parkingForm").reset();
  document.getElementById("resultSection").classList.add("hidden");
  document.getElementById("receiptSection").classList.add("hidden");
  const actionsSection = document.getElementById("actionsSection");
  if (actionsSection) actionsSection.classList.add("hidden");
}

function onPrint() {
  window.print();
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  const current = localStorage.getItem("theme") || "light";
  const newTheme = current === "light" ? "dark" : "light";
  applyTheme(newTheme);
}

function getVehicleLabel(vehicle) {
  const labels = {
    mobil: "Mobil",
    motor: "Motor",
    box: "Box/Truk",
    valet_weekday: "Valet Weekday",
    valet_weekend: "Valet Weekend",
  };
  return labels[vehicle] || vehicle;
}

function getVehicleRates(vehicleType) {
  const rates = {
    mobil: {
      firstRate: 5000,
      nextRate: 3000,
      method: "hourly",
      vehicle: "mobil",
    },
    motor: {
      firstRate: 2000,
      nextRate: 1000,
      method: "hourly",
      vehicle: "motor",
    },
    box: { firstRate: 10000, nextRate: 5000, method: "hourly", vehicle: "box" },
    valet_weekday: {
      firstRate: 25000,
      nextRate: 5000,
      method: "hourly",
      vehicle: "valet_weekday",
    },
    valet_weekend: {
      firstRate: 30000,
      nextRate: 5000,
      method: "hourly",
      vehicle: "valet_weekend",
    },
  };
  return rates[vehicleType] || rates.mobil;
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("parkingForm");
  const resetBtn = document.getElementById("resetBtn");
  const printBtn = document.getElementById("printBtn");
  const themeToggle = document.getElementById("themeToggle");

  if (form) form.addEventListener("submit", onSubmit);
  if (resetBtn) resetBtn.addEventListener("click", onReset);
  if (printBtn) printBtn.addEventListener("click", onPrint);
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  const now = new Date();
  const entryTime = document.getElementById("entryTime");
  const exitTime = document.getElementById("exitTime");

  if (entryTime && exitTime) {
    const entryDefault = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    entryTime.value = entryDefault.toISOString().slice(0, 16);
    exitTime.value = now.toISOString().slice(0, 16);
  }

  const showReceiptBtn = document.getElementById("showReceiptBtn");
  if (showReceiptBtn) {
    showReceiptBtn.addEventListener("click", () => {
      if (window.__lastReceiptData) {
        const { breakdown, entry, exit } = window.__lastReceiptData;
        const receiptContainer = document.getElementById("receipt");
        const receiptSection = document.getElementById("receiptSection");

        receiptContainer.innerHTML = buildReceipt({ breakdown, entry, exit });
        receiptSection.classList.remove("hidden");
      } else {
        alert("Belum ada data resi. Hitung tarif terlebih dahulu.");
      }
    });
  }
});

window.showTransactionDetails = showTransactionDetails;

function clearTransactionHistory() {
  if (confirm("Yakin ingin menghapus semua riwayat transaksi?")) {
    localStorage.removeItem("parkingHistory");
    const container = document.getElementById("transactionHistory");
    if (container) renderTransactionHistory(container);
  }
}
window.clearTransactionHistory = clearTransactionHistory;
