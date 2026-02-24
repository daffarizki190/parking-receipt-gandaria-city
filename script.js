/**
 * script.js — Core Parking Logic
 * ParkMate Gandaria · clean ES6+
 */

// ─── Formatters ───────────────────────────────────────────────────
const formatIDR = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const pad = (n) => String(n).padStart(2, "0");

const formatDateTime = (dt) => {
  if (!dt) return "-";
  const d = new Date(dt);
  const tgl = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  const jam = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${tgl} ${jam} WIB`;
};

const calcDurationMinutes = (start, end) =>
  Math.floor((end - start) / 60_000);

const getVehicleLabel = (vehicleType) => {
  const labels = {
    mobil: "🚗 Mobil",
    motor: "🏍️ Motor",
    box: "🚛 Box / Truk",
    valet_weekday: "🎖️ Valet Weekday",
    valet_weekend: "🎖️ Valet Weekend",
  };
  return labels[vehicleType] || vehicleType;
};

// ─── Tariff Config ────────────────────────────────────────────────
const TARIFF = {
  mobil: { firstRate: 5_000, nextRate: 4_000 },
  motor: { firstRate: 2_000, nextRate: 2_000 },
  box: { firstRate: 7_000, nextRate: 3_000 },
  valet_weekday: { firstRate: 75_000 + 5_000, nextRate: 4_000 },
  valet_weekend: { firstRate: 100_000 + 5_000, nextRate: 4_000 },
};

// ─── Breakdown Calculation ────────────────────────────────────────
const buildBreakdown = ({ vehicle, entry, exit }) => {
  const { firstRate, nextRate } = TARIFF[vehicle] || {};
  if (!firstRate) return { error: "Jenis kendaraan tidak valid." };

  const totalMinutes = calcDurationMinutes(entry, exit);
  if (isNaN(totalMinutes) || totalMinutes <= 0)
    return { error: "Jam keluar harus lebih besar dari jam masuk." };

  const durHours = Math.floor(totalMinutes / 60);
  const durMins = totalMinutes % 60;
  const durDays = Math.floor(durHours / 24);
  const durHoursRem = durHours % 24;

  const additionalMinutes = Math.max(0, totalMinutes - 60);
  const additionalHours = Math.ceil(additionalMinutes / 60);
  const additionalCharge = additionalHours * nextRate;

  const hourlyRows = [];

  if (vehicle === "valet_weekday" || vehicle === "valet_weekend") {
    const valetFee = vehicle === "valet_weekday" ? 75_000 : 100_000;
    const parkingFee = 5_000;
    hourlyRows.push({ label: "Tarif Valet", unit: "1×", subtotal: valetFee });
    hourlyRows.push({ label: "Jam pertama", unit: "1 jam", subtotal: parkingFee });
    if (additionalMinutes > 0) {
      hourlyRows.push({
        label: "Sisa durasi",
        unit: `${additionalHours} jam × ${formatIDR(nextRate)}`,
        subtotal: additionalCharge,
      });
    }
  } else {
    hourlyRows.push({ label: "Jam pertama", unit: "1 jam", subtotal: firstRate });
    if (additionalMinutes > 0) {
      hourlyRows.push({
        label: "Sisa durasi",
        unit: `${additionalHours} jam × ${formatIDR(nextRate)}`,
        subtotal: additionalCharge,
      });
    }
  }

  const totalCharge = firstRate + additionalCharge;
  return {
    totalMinutes,
    durHours, durMins, durDays, durHoursRem,
    additionalMinutes, additionalHours,
    additionalCharge, totalCharge,
    hourlyRows,
    methodLabel: "Per jam (dibulatkan ke atas)",
  };
};

// ─── Renderers ────────────────────────────────────────────────────
const renderBreakdown = (container, data, { entry, exit }) => {
  container.innerHTML = `
    <div class="kv-grid slide-in-bottom">
      <div class="kv-label">Jam Masuk</div>
      <div class="kv-value mono">${formatDateTime(entry)}</div>
      <div class="kv-label">Jam Keluar</div>
      <div class="kv-value mono">${formatDateTime(exit)}</div>
      <div class="kv-label">Durasi</div>
      <div class="kv-value">
        <span class="badge">${data.durDays}h ${data.durHoursRem}j ${data.durMins}m</span>
        <span style="color:var(--text-secondary); font-size:0.8rem; margin-left:8px;">(${data.totalMinutes} menit)</span>
      </div>
      <div class="kv-label">Metode</div>
      <div class="kv-value" style="font-size:0.85rem;">${data.methodLabel}</div>
    </div>

    <div style="overflow-x:auto; margin-top:4px;">
      <table class="data-table">
        <thead>
          <tr><th>Komponen</th><th>Rincian</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          ${data.hourlyRows.map((r) => `
            <tr>
              <td>${r.label}</td>
              <td style="color:var(--text-secondary); font-size:0.85rem;">${r.unit}</td>
              <td class="mono" style="font-weight:500;">${formatIDR(r.subtotal)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">Total Tarif</td>
            <td class="mono" style="color:var(--text-accent);">${formatIDR(data.totalCharge)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
};

const buildReceiptHTML = ({ breakdown, entry, exit, vehicle }) => {
  const now = new Date();
  const id = `PKR-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  window.__lastReceiptId = id;

  return `
    <div class="receipt-wrapper" id="receiptPrintArea">
      <div class="receipt-header-row">
        <div>
          <div class="mono" style="font-size:0.75rem; color:var(--text-secondary);">No. Resi</div>
          <div class="mono" style="font-weight:600;">${id}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.75rem; color:var(--text-secondary);">Tanggal Cetak</div>
          <div class="mono" style="font-size:0.8rem; font-weight:500;">${formatDateTime(now)}</div>
        </div>
      </div>

      <div class="kv-grid" style="grid-template-columns:100px 1fr; gap:8px; margin-bottom:16px;">
        <div class="kv-label">Kendaraan</div><div class="kv-value">${getVehicleLabel(vehicle)}</div>
        <div class="kv-label">Masuk</div><div class="kv-value mono" style="font-size:0.85rem;">${formatDateTime(entry)}</div>
        <div class="kv-label">Keluar</div><div class="kv-value mono" style="font-size:0.85rem;">${formatDateTime(exit)}</div>
        <div class="kv-label">Durasi</div><div class="kv-value" style="font-size:0.85rem;">${breakdown.durDays}h ${breakdown.durHoursRem}j ${breakdown.durMins}m</div>
      </div>

      <table class="data-table" style="font-size:0.85rem;">
        <thead><tr><th>Deskripsi</th><th>Qty</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${breakdown.hourlyRows.map((r) => `
            <tr>
              <td>${r.label}</td>
              <td style="color:var(--text-secondary);">${r.unit}</td>
              <td class="mono">${formatIDR(r.subtotal)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">Total Bayar</td>
            <td class="mono" style="color:var(--text-accent); font-size:1.05rem;">${formatIDR(breakdown.totalCharge)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
};

// ─── Local Storage ────────────────────────────────────────────────
const saveTransaction = (breakdown, entry, exit, vehicle) => {
  const history = JSON.parse(localStorage.getItem("parkingHistory") || "[]");
  if (history.length >= 50) history.pop();

  history.unshift({
    id: `PKR-${Date.now()}`,
    timestamp: new Date().toISOString(),
    vehicle,
    entry: entry.toISOString(),
    exit: exit.toISOString(),
    methodLabel: breakdown.methodLabel,
    duration: breakdown.totalMinutes,
    total: breakdown.totalCharge,
  });

  localStorage.setItem("parkingHistory", JSON.stringify(history));
};

// ─── Section Navigation ───────────────────────────────────────────
const SECTIONS = ["formSection", "qrScanSection", "resultSection", "receiptSection"];

const showSection = (targetId) => {
  SECTIONS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", id !== targetId);
  });
};

// ─── Form Submit ──────────────────────────────────────────────────
const onSubmit = (evt) => {
  evt.preventDefault();
  const vehicle = document.getElementById("vehicleType").value;
  const entryVal = document.getElementById("entryTime").value;
  const exitVal = document.getElementById("exitTime").value;

  if (!vehicle || !entryVal || !exitVal) return;

  const entry = new Date(entryVal);
  const exit = new Date(exitVal);
  const breakdown = buildBreakdown({ vehicle, entry, exit });

  if (breakdown.error) {
    alert(breakdown.error);
    return;
  }

  renderBreakdown(document.getElementById("breakdown"), breakdown, { entry, exit });
  showSection("resultSection");

  window.__lastReceiptData = { breakdown, entry, exit, vehicle };
  saveTransaction(breakdown, entry, exit, vehicle);
};

const onReset = () => {
  document.getElementById("parkingForm").reset();
  showSection("formSection");
};

// ─── DOMContentLoaded ─────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  // Core form
  document.getElementById("parkingForm")?.addEventListener("submit", onSubmit);
  document.getElementById("resetBtn")?.addEventListener("click", onReset);
  document.getElementById("backToFormBtn")?.addEventListener("click", () => showSection("formSection"));
  document.getElementById("backToResultBtn")?.addEventListener("click", () => showSection("resultSection"));

  // Open Receipt
  document.getElementById("openReceiptBtn")?.addEventListener("click", () => {
    const data = window.__lastReceiptData;
    if (!data) return alert("Hitung tarif dahulu.");
    const rc = document.getElementById("receipt");
    rc.innerHTML = buildReceiptHTML(data);
    showSection("receiptSection");
    // Generate QR ticket for entry
    generateEntryQR(data);
  });

  // Tab navigation
  document.getElementById("tab-hitung")?.addEventListener("click", () => {
    setActiveTab("tab-hitung");
    showSection("formSection");
  });
  document.getElementById("tab-scan-qr")?.addEventListener("click", () => {
    setActiveTab("tab-scan-qr");
    showSection("qrScanSection");
  });
});

const setActiveTab = (activeId) => {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.id === activeId);
    btn.setAttribute("aria-selected", btn.id === activeId);
  });
};

// ─── QR Ticket Generator ──────────────────────────────────────────
const generateEntryQR = ({ entry, exit, vehicle, breakdown }) => {
  const qrSection = document.getElementById("qrTicketSection");
  const qrCanvas = document.getElementById("qrTicketCanvas");
  if (!qrSection || !qrCanvas || typeof QRCode === "undefined") return;

  const payload = JSON.stringify({
    v: vehicle,
    e: entry.toISOString(),
    x: exit.toISOString(),
    t: breakdown.totalCharge,
  });

  QRCode.toCanvas(qrCanvas, payload, { width: 160, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } }, (err) => {
    if (!err) qrSection.classList.remove("hidden");
  });
};

// ─── Exposed globals (used by features.js & history page) ─────────
window.ParkMate = {
  formatIDR,
  formatDateTime,
  getVehicleLabel,
  buildBreakdown,
  saveTransaction,
  showSection,
  setActiveTab,
  generateEntryQR,
  buildReceiptHTML,
};
