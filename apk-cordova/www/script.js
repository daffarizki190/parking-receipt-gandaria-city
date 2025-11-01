function formatIDR(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatDateTime(dt) {
  const d = new Date(dt);
  const tgl = `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}`;
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
    return { error: 'Jam keluar harus lebih besar dari jam masuk.' };
  }

  const durHours = Math.floor(totalMinutes / 60);
  const durMins = totalMinutes % 60;
  const durDays = Math.floor(durHours / 24);
  const durHoursRem = durHours % 24;

  // Dukungan tarif flat untuk Motor
  if (method === 'flat') {
    const totalCharge = firstRate;
    const hourlyRows = [{ label: 'Tarif flat', unit: '-', subtotal: totalCharge }];
    return {
      totalMinutes,
      durHours,
      durMins,
      firstHourCharge: totalCharge,
      additionalMinutes: 0,
      units: 0,
      unitPrice: 0,
      additionalCharge: 0,
      totalCharge,
      hourlyRows,
      explanation: 'Tarif flat tanpa perhitungan per jam.',
      methodLabel: 'Tarif flat',
      formula: '-',
    };
  }

  const firstHourCharge = firstRate;
  const additionalMinutes = Math.max(0, totalMinutes - 60);

  let units = 0;
  let unitPrice = 0;
  let additionalCharge = 0;
  let methodLabel = '';
  let formula = '';
  let unitLabel = '';

  if (additionalMinutes > 0) {
    switch (method) {
      case 'hourly_up': {
        units = Math.ceil(additionalMinutes / 60);
        unitPrice = nextRate;
        additionalCharge = units * unitPrice;
        methodLabel = 'Per jam (dibulatkan ke atas)';
        unitLabel = `${units} jam x ${formatIDR(unitPrice)}`;
        formula = `ceil(${additionalMinutes}/60) × ${formatIDR(nextRate)}`;
        break;
      }
      case 'half_hour_up': {
        units = Math.ceil(additionalMinutes / 30);
        unitPrice = Math.round(nextRate / 2);
        additionalCharge = units * unitPrice;
        methodLabel = 'Per 30 menit (dibulatkan ke atas)';
        unitLabel = `${units} × 30 menit x ${formatIDR(unitPrice)}`;
        formula = `ceil(${additionalMinutes}/30) × ${formatIDR(Math.round(nextRate/2))}`;
        break;
      }
      case 'per_minute':
      default: {
        units = additionalMinutes;
        unitPrice = Math.round(nextRate / 60);
        additionalCharge = units * unitPrice;
        methodLabel = 'Per menit (proporsional)';
        unitLabel = `${units} menit x ${formatIDR(unitPrice)}`;
        formula = `${additionalMinutes} × ${formatIDR(Math.round(nextRate/60))}`;
        break;
      }
    }
  } else {
    methodLabel = method === 'hourly_up' ? 'Per jam (dibulatkan ke atas)'
                  : method === 'half_hour_up' ? 'Per 30 menit (dibulatkan ke atas)'
                  : 'Per menit (proporsional)';
    unitLabel = `0`;
    formula = 'Durasi ≤ 60 menit';
  }

  const totalCharge = firstHourCharge + additionalCharge;

  const hourlyRows = [];
  
  // Khusus untuk valet, pisahkan komponen tarif valet dan parkir
  if (vehicle === 'valet_weekday' || vehicle === 'valet_weekend') {
    const valetFee = vehicle === 'valet_weekday' ? 75000 : 100000;
    const parkingFee = 5000;
    
    hourlyRows.push({ label: 'Tarif Valet', unit: '1x', subtotal: valetFee });
    hourlyRows.push({ label: 'Parkir Jam 1', unit: '1 jam', subtotal: parkingFee });
    
    if (additionalMinutes > 0) {
      hourlyRows.push({ label: 'Sisa durasi', unit: unitLabel, subtotal: additionalCharge });
    }
  } else {
    hourlyRows.push({ label: 'Jam 1', unit: '1 jam', subtotal: firstHourCharge });
    hourlyRows.push({ label: 'Sisa durasi', unit: unitLabel, subtotal: additionalCharge });
  }

  // Hapus penjelasan pembulatan dari UI
  const explanation = '';

  return {
    totalMinutes,
    durHours,
    durMins,
    durDays,
    durHoursRem,
    firstHourCharge,
    additionalMinutes,
    units,
    unitPrice,
    additionalCharge,
    totalCharge,
    hourlyRows,
    explanation,
    methodLabel,
    formula,
  };
}

// Dinamis: pastikan library QR available, fallback jika gagal
function ensureQrLib() {
  return new Promise((resolve, reject) => {
    if (window.QRCode) return resolve(true);
    const status = document.getElementById('qrStatus');

    const tryLoad = (src, label) => new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => res(true);
      s.onerror = () => rej(new Error(label));
      document.head.appendChild(s);
    });

    const sources = [
      { src: 'qrcode.min.js', label: 'lokal' },
      ...(navigator.onLine ? [
        { src: 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js', label: 'jsDelivr' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', label: 'CDNJS' },
      ] : [])
    ];

    (async () => {
      for (const { src, label } of sources) {
        if (status) status.textContent = `Memuat library QR (${label})…`;
        try {
          await tryLoad(src, label);
          if (window.QRCode) return resolve(true);
        } catch (_) { /* lanjut ke sumber berikutnya */ }
      }
      reject(new Error('QR library tidak tersedia'));
    })();
  });
}

// Perbarui tampilan breakdown agar menyertakan metode dan formula
function renderBreakdown(container, data, ctx) {
  const { entry, exit, method } = ctx;
  const html = `
    <div class="flex-col">
      <div class="kv">
        <div>Jam masuk</div>
        <div class="mono">${formatDateTime(entry)}</div>
        <div>Jam keluar</div>
        <div class="mono">${formatDateTime(exit)}</div>
        <div>Durasi</div>
        <div><span class="badge">${data.durDays} Hari ${data.durHoursRem} Jam ${data.durMins} Menit</span> (${data.totalMinutes} menit)</div>
        <div>Metode</div>
        <div>${data.methodLabel}</div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Komponen</th>
            <th>Rincian</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${data.hourlyRows.map(row => `
            <tr>
              <td>${row.label}</td>
              <td>${row.unit}</td>
              <td class="mono">${formatIDR(row.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">Total</td>
            <td class="mono">${formatIDR(data.totalCharge)}</td>
          </tr>
        </tfoot>
      </table>

      ${data.explanation ? `<small>${data.explanation}</small>` : ''}
    </div>
  `;
  container.innerHTML = html;
}

function buildReceipt({ breakdown, entry, exit }) {
  const now = new Date();
  const id = `PKR-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;

  return `
    <div class="receipt">
      <div class="receipt-header">
        <div>
          <div class="mono">No. Resi: ${id}</div>
          <div class="mono">Dibuat: ${formatDateTime(now)}</div>
        </div>
        <div>
          <strong>Total: ${formatIDR(breakdown.totalCharge)}</strong>
        </div>
      </div>

  <div class="kv">
    <div>Jam masuk</div>
    <div class="mono">${formatDateTime(entry)}</div>
    <div>Jam keluar</div>
    <div class="mono">${formatDateTime(exit)}</div>
    <div>Durasi</div>
    <div>${breakdown.durDays} Hari ${breakdown.durHoursRem} Jam ${breakdown.durMins} Menit (${breakdown.totalMinutes} menit)</div>
    <div>Metode</div>
    <div>${breakdown.methodLabel}</div>
  </div>

      <hr />

      <table class="table">
        <thead>
          <tr>
            <th>Komponen</th>
            <th>Rincian</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${breakdown.hourlyRows.map(row => `
            <tr>
              <td>${row.label}</td>
              <td>${row.unit}</td>
              <td class="mono">${formatIDR(row.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">Total</td>
            <td class="mono">${formatIDR(breakdown.totalCharge)}</td>
          </tr>
        </tfoot>
      </table>

      ${breakdown.explanation ? `<p><small>${breakdown.explanation}</small></p>` : ''}
    </div>
  `;
}

// Helper untuk base64 JSON aman di URL
function toBase64Url(jsonStr){
  const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
  return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

// Bangun payload QR sebagai LINK yang bisa dibuka Google Kamera
function buildQrLink(breakdown, entry, exit){
  const payload = {
    id: `PKR-${new Date().getTime()}`,
    total: breakdown.totalCharge,
    masuk: formatDateTime(entry),
    keluar: formatDateTime(exit),
    durasi_menit: breakdown.totalMinutes,
    metode: breakdown.methodLabel,
  };
  const json = JSON.stringify(payload);
  const data = toBase64Url(json);
  // Base URL aman untuk subpath: gunakan direktori saat ini
  const baseDir = new URL('./', window.location.href);
  const urlObj = new URL('receipt.html', baseDir);
  urlObj.searchParams.set('data', data);
  const url = urlObj.href;
  return url;
}

// Tambah: QR/barcode untuk resi digital
function renderQRCode(linkUrl) {
  const el = document.getElementById('qr');
  const status = document.getElementById('qrStatus');
  const qrLinkEl = document.getElementById('qrLink');
  const online = navigator.onLine;

  if (qrLinkEl) {
    qrLinkEl.href = linkUrl;
    qrLinkEl.textContent = linkUrl;
  }

  // Reset QR container
  if (el) el.innerHTML = '';

  if (!online) {
    // Offline: jangan tampilkan barcode, hanya tautan
    if (status) status.textContent = 'Perangkat offline — gunakan tautan di atas.';
    if (el) { el.classList.remove('show'); el.classList.add('hidden'); }
    return;
  }

  // Online: buat barcode
  if (status) status.innerHTML = 'Membuat QR… <span class="spinner"></span>';
  if (el) el.classList.remove('hidden');

  ensureQrLib()
    .then(() => {
      if (window.QRCode && el) {
        new QRCode(el, {
          text: linkUrl,
          width: 180,
          height: 180,
          correctLevel: QRCode.CorrectLevel.M,
        });
        if (status) status.textContent = 'QR berhasil dibuat. Scan untuk membuka resi.';
        el.classList.add('show');
      }
    })
    .catch(() => {
      // Gagal memuat library meski online: tampilkan tautan saja
      if (status) status.textContent = 'Gagal memuat library QR. Gunakan tautan.';
      if (el) { el.classList.remove('show'); el.classList.add('hidden'); }
    });
}

function onDownloadQr() {
  const el = document.getElementById('qr');
  const img = el.querySelector('img');
  const canvas = el.querySelector('canvas');
  let dataURL = '';
  if (img) {
    dataURL = img.src;
  } else if (canvas) {
    dataURL = canvas.toDataURL('image/png');
  } else {
    alert('Barcode belum dibuat. Hitung tarif dulu.');
    return;
  }
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'resi-barcode.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function openPrintPreview() {
  const receiptHtml = document.getElementById('receipt').innerHTML;
  const stylesLink = '<link rel="stylesheet" href="styles.css" />';
  const win = window.open('', '_blank');
  if (!win) {
    alert('Tidak dapat membuka pratinjau cetak (pop-up diblokir?).');
    return;
  }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">${stylesLink}<title>Pratinjau Cetak Resi</title></head><body><section id="receiptSection" class="card">${receiptHtml}</section></body></html>`);
  win.document.close();
  win.focus();
}

function onSubmit(evt) {
  evt.preventDefault();
  const vehicle = document.getElementById('vehicleType').value;
  let firstRate = 0;
  let nextRate = 0;
  let method = 'hourly_up';
  if (vehicle === 'mobil') {
    firstRate = 5000; nextRate = 4000; method = 'hourly_up';
  } else if (vehicle === 'motor') {
    firstRate = 2000; nextRate = 2000; method = 'hourly_up';
  } else if (vehicle === 'box') {
    firstRate = 7000; nextRate = 3000; method = 'hourly_up';
  } else if (vehicle === 'valet_weekday') {
    // Valet Weekday: valet 75.000 + parkir 5.000, selanjutnya +4.000/jam
    firstRate = 75000 + 5000; nextRate = 4000; method = 'hourly_up';
  } else if (vehicle === 'valet_weekend') {
    // Valet Weekend: valet 100.000 + parkir 5.000, selanjutnya +4.000/jam
    firstRate = 100000 + 5000; nextRate = 4000; method = 'hourly_up';
  }
  const entryVal = document.getElementById('entryTime').value;
  const exitVal = document.getElementById('exitTime').value;

  if (!(entryVal && exitVal)) return;
  // Tidak perlu validasi input tarif; tarif ditentukan otomatis dari jenis kendaraan

  const entry = new Date(entryVal);
  const exit = new Date(exitVal);

  const breakdown = buildBreakdown({ firstRate, nextRate, entry, exit, method, vehicle });
  const resultSection = document.getElementById('resultSection');
  const receiptSection = document.getElementById('receiptSection');
  const breakdownContainer = document.getElementById('breakdown');
  const receiptContainer = document.getElementById('receipt');

  if (breakdown.error) {
    resultSection.classList.add('hidden');
    receiptSection.classList.add('hidden');
    alert(breakdown.error);
    return;
  }

  // Tampilkan hanya breakdown; resi tidak langsung ditampilkan
  renderBreakdown(breakdownContainer, breakdown, { entry, exit, method });
  resultSection.classList.remove('hidden');

  // Simpan data resi terakhir untuk ditampilkan saat tombol ditekan
  window.__lastReceiptData = { breakdown, entry, exit };
  // Sembunyikan resi sampai tombol Buka Resi ditekan
  receiptSection.classList.add('hidden');
  receiptContainer.innerHTML = '';

  // Simpan transaksi ke riwayat
  saveTransactionHistory(breakdown, entry, exit, vehicle);
  
  // Perbarui tampilan riwayat transaksi
  const historyContainer = document.getElementById('transactionHistory');
  // Jangan render otomatis di halaman utama

  // Buat tautan resi dan simpan untuk tombol Buka Resi
  const receiptLink = buildQrLink(breakdown, entry, exit);
  window.__receiptLink = receiptLink;

  // Tampilkan tombol aksi di bawah detail perhitungan
  const actionsSection = document.getElementById('actionsSection');
  if (actionsSection) actionsSection.classList.remove('hidden');
}

function onReset() {
  document.getElementById('parkingForm').reset();
  document.getElementById('resultSection').classList.add('hidden');
  document.getElementById('receiptSection').classList.add('hidden');
  const actionsSection = document.getElementById('actionsSection');
  if (actionsSection) actionsSection.classList.add('hidden');
  const qrEl = document.getElementById('qr');
  const status = document.getElementById('qrStatus');
  const qrLinkEl = document.getElementById('qrLink');
  if (qrEl) qrEl.innerHTML = '';
  if (status) status.textContent = '';
  if (qrLinkEl) { qrLinkEl.removeAttribute('href'); qrLinkEl.textContent=''; }
}

function onPrint() {
  window.print();
}

function onCopyLink(){
  const linkEl = document.getElementById('qrLink');
  const link = (linkEl && (linkEl.href || linkEl.textContent)) || '';
  if (!link){ alert('Tautan belum tersedia. Hitung tarif dulu.'); return; }
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(link).then(()=>{
      const btn = document.getElementById('copyLinkBtn');
      if (btn){ const prev = btn.textContent; btn.textContent = 'Tersalin!'; setTimeout(()=> btn.textContent = prev, 1200); }
    }).catch(()=> alert('Gagal menyalin tautan'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = link; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    const btn = document.getElementById('copyLinkBtn');
    if (btn){ const prev = btn.textContent; btn.textContent = 'Tersalin!'; setTimeout(()=> btn.textContent = prev, 1200); }
  }
}

function applyTheme(theme){
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark', isDark);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = isDark ? '☀️ Mode Terang' : '🌙 Mode Gelap';
}
function toggleTheme(){
  const current = document.body.classList.contains('dark') ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
}

// Fungsi untuk mendapatkan label kendaraan yang lebih deskriptif
function getVehicleLabel(vehicle) {
  const labels = {
    'motor': 'Motor',
    'mobil': 'Mobil',
    'box': 'Box',
    'valet_weekday': 'Valet Weekday',
    'valet_weekend': 'Valet Weekend'
  };
  return labels[vehicle] || vehicle;
}

// Fungsi untuk menyimpan riwayat transaksi
function saveTransactionHistory(breakdown, entry, exit, vehicle) {
  // Ambil riwayat yang ada (samakan key dengan versi web)
  let history = JSON.parse(localStorage.getItem('parkingHistory') || '[]');
  
  // Tambahkan transaksi baru
  const transaction = {
    id: Date.now(),
    date: new Date().toISOString(),
    breakdown,
    entry,
    exit,
    vehicle,
    total: breakdown.totalCharge
  };
  
  // Tambahkan ke awal array (transaksi terbaru di atas)
  history.unshift(transaction);
  
  // Batasi jumlah riwayat (simpan 20 terakhir)
  if (history.length > 20) {
    history = history.slice(0, 20);
  }
  
  // Simpan kembali ke localStorage
  localStorage.setItem('parkingHistory', JSON.stringify(history));
}

// Fungsi untuk mendapatkan riwayat transaksi
function getTransactionHistory() {
  return JSON.parse(localStorage.getItem('parkingHistory') || '[]');
}

// Fungsi untuk menampilkan riwayat transaksi
function renderTransactionHistory(container) {
  const history = getTransactionHistory();
  
  if (history.length === 0) {
    container.innerHTML = '<p>Belum ada riwayat transaksi.</p>';
    return;
  }
  
  const historyHTML = `
    <div class="transaction-history">
      <div class="history-list">
        ${history.map(transaction => {
          const entryDate = new Date(transaction.entry);
          const exitDate = new Date(transaction.exit);
          const formattedEntry = entryDate.toLocaleString('id-ID');
          const formattedExit = exitDate.toLocaleString('id-ID');
          const vehicleLabel = getVehicleLabel(transaction.vehicle);
          const totalValue = typeof transaction.total === 'number'
            ? transaction.total
            : (transaction.breakdown && typeof transaction.breakdown.totalCharge === 'number'
                ? transaction.breakdown.totalCharge
                : 0);
          const dateValue = transaction.date || transaction.timestamp || new Date().toISOString();

          // Hitung atau ambil durasi dari breakdown
          const bd = transaction.breakdown || {};
          let durDays, durHoursRem, durMins, totalMinutes;
          if (typeof bd.durDays !== 'undefined' && typeof bd.durHoursRem !== 'undefined' && typeof bd.durMins !== 'undefined') {
            durDays = bd.durDays;
            durHoursRem = bd.durHoursRem;
            durMins = bd.durMins;
            totalMinutes = bd.totalMinutes;
          } else {
            const tm = Math.max(0, Math.floor((exitDate - entryDate) / 60000));
            const h = Math.floor(tm / 60);
            durDays = Math.floor(h / 24);
            durHoursRem = h % 24;
            durMins = tm % 60;
            totalMinutes = tm;
          }
          
          return `
            <div class="history-item">
              <div class="history-header">
                <div>
                  <strong>${vehicleLabel}</strong>
                  <div>Tanggal: ${new Date(dateValue).toLocaleDateString('id-ID')}</div>
                </div>
                <div>
                  <strong>Rp ${totalValue.toLocaleString('id-ID')}</strong>
                </div>
              </div>
              <div>
                <div>Masuk: ${formattedEntry}</div>
                <div>Keluar: ${formattedExit}</div>
                <div>Durasi: <span class="badge">${durDays} Hari ${durHoursRem} Jam ${durMins} Menit</span> (${totalMinutes} menit)</div>
              </div>
              <button class="view-details-btn" onclick="showTransactionDetails('${transaction.id}')">Lihat Detail</button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  
  container.innerHTML = historyHTML;
}

// Fungsi untuk menampilkan detail transaksi
function showTransactionDetails(transactionId) {
  const history = getTransactionHistory();
  const transaction = history.find(t => t.id.toString() === transactionId);
  
  if (!transaction) return;
  
  const entryDate = new Date(transaction.entry);
  const exitDate = new Date(transaction.exit);
  const formattedEntry = entryDate.toLocaleString('id-ID');
  const formattedExit = exitDate.toLocaleString('id-ID');
  const vehicleLabel = getVehicleLabel(transaction.vehicle);
  
  // Buat modal untuk menampilkan detail
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const receiptHTML = buildReceipt({
    breakdown: transaction.breakdown,
    entry: transaction.entry,
    exit: transaction.exit
  });
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Detail Transaksi</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div>
        <p><strong>Kendaraan:</strong> ${vehicleLabel}</p>
        <p><strong>Masuk:</strong> ${formattedEntry}</p>
        <p><strong>Keluar:</strong> ${formattedExit}</p>
        <hr>
        ${receiptHTML}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  // Tampilkan modal (di CSS Cordova default-nya display: none)
  modal.style.display = 'block';
}

window.addEventListener('DOMContentLoaded', () => {
  const parkingForm = document.getElementById('parkingForm');
  if (parkingForm) {
    parkingForm.addEventListener('submit', onSubmit);
  }
  
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', onReset);
  }
  // Tampilkan resi saat tombol ditekan (tidak otomatis saat submit)
  const openBtn = document.getElementById('openReceiptBtn');
  if (openBtn) openBtn.addEventListener('click', () => {
    const data = window.__lastReceiptData;
    if (!data) { alert('Hitung tarif dulu untuk membuat resi.'); return; }
    const { breakdown, entry, exit } = data;
    const receiptHTML = buildReceipt({ breakdown, entry, exit });
    const rc = document.getElementById('receipt');
    const rs = document.getElementById('receiptSection');
    if (rc && rs) {
      rc.innerHTML = receiptHTML;
      rs.classList.remove('hidden');
    }
    // Render QR dan pasang handler tombol terkait
    const link = window.__receiptLink;
    if (link) { renderQRCode(link); }
    const dl = document.getElementById('downloadQrBtn');
    if (dl) dl.addEventListener('click', onDownloadQr);
    const cp = document.getElementById('copyLinkBtn');
    if (cp) cp.addEventListener('click', onCopyLink);
  });

  // Navigasi ke halaman riwayat
  const historyBtn = document.getElementById('openHistoryBtn');
  if (historyBtn) {
    historyBtn.addEventListener('click', () => {
      window.location.href = 'history.html';
    });
  }

  // Tampilkan riwayat transaksi saat halaman dimuat
  const historyContainer = document.getElementById('transactionHistory');
  if (historyContainer) {
    // Halaman riwayat khusus akan memanggil render sendiri.
  }

  // Tidak ada barcode; tidak perlu re-render saat online/offline
});

// Tambahkan showTransactionDetails ke window agar bisa dipanggil dari onclick
window.showTransactionDetails = showTransactionDetails;

// Tambahkan fungsi reset riwayat untuk halaman history Cordova
function clearTransactionHistory() {
  localStorage.setItem('parkingHistory', '[]');
}
window.clearTransactionHistory = clearTransactionHistory;