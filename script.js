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

  // Hapus penjelasan pembulatan dari UI sesuai permintaan
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
        <div>${breakdown.durDays} hari ${breakdown.durHoursRem} jam ${breakdown.durMins} menit (${breakdown.totalMinutes} menit)</div>
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

      <p><small>${breakdown.explanation}</small></p>
    </div>
  `;
}





// Fungsi untuk menyimpan riwayat transaksi ke localStorage
function saveTransactionHistory(breakdown, entry, exit, vehicle) {
  // Ambil riwayat yang sudah ada
  let history = JSON.parse(localStorage.getItem('parkingHistory') || '[]');
  
  // Batasi jumlah riwayat yang disimpan (maksimal 20 transaksi)
  if (history.length >= 20) {
    history.pop(); // Hapus transaksi terlama
  }
  
  // Buat objek transaksi baru
  const transaction = {
    id: `PKR-${new Date().getTime()}`,
    timestamp: new Date().toISOString(),
    vehicle: vehicle,
    entry: entry.toISOString(),
    exit: exit.toISOString(),
    methodLabel: breakdown.methodLabel,
    explanation: breakdown.explanation || '',
    duration: {
      days: breakdown.durDays,
      hours: breakdown.durHoursRem,
      minutes: breakdown.durMins,
      totalMinutes: breakdown.totalMinutes
    },
    charges: {
      total: breakdown.totalCharge,
      breakdown: breakdown.hourlyRows.map(row => ({
        label: row.label,
        unit: row.unit,
        subtotal: row.subtotal
      }))
    }
  };
  
  // Tambahkan transaksi baru ke awal array
  history.unshift(transaction);
  
  // Simpan kembali ke localStorage
  localStorage.setItem('parkingHistory', JSON.stringify(history));
}

// Fungsi untuk mendapatkan riwayat transaksi dari localStorage
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
  
  const html = `
    <div class="transaction-history">
      <h3>Riwayat Transaksi Terakhir</h3>
      <div class="history-list">
        ${history.map((transaction, index) => `
          <div class="history-item card" data-index="${index}">
            <div class="history-header">
              <div>
                <div class="mono">${transaction.id}</div>
                <div>${new Date(transaction.timestamp).toLocaleString('id-ID')}</div>
              </div>
              <div>
                <strong>${formatIDR(transaction.charges.total)}</strong>
              </div>
            </div>
            <div class="history-details">
              <div class="kv">
                <div>Kendaraan</div>
                <div>${getVehicleLabel(transaction.vehicle)}</div>
                <div>Durasi</div>
                <div>${(transaction.duration && typeof transaction.duration.days !== 'undefined') ? `${transaction.duration.days} Hari ${transaction.duration.hours} Jam ${transaction.duration.minutes} Menit` : `${Math.floor(transaction.duration.totalMinutes/1440)} Hari ${Math.floor((transaction.duration.totalMinutes%1440)/60)} Jam ${transaction.duration.totalMinutes%60} Menit`}</div>
                <div>Masuk</div>
                <div>${formatDateTime(new Date(transaction.entry))}</div>
                <div>Keluar</div>
                <div>${formatDateTime(new Date(transaction.exit))}</div>
              </div>
              <button class="view-details-btn" data-index="${index}">Lihat Detail</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Tambahkan event listener untuk tombol detail
  const detailButtons = container.querySelectorAll('.view-details-btn');
  detailButtons.forEach(button => {
    button.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      showTransactionDetails(history[index]);
    });
  });
}

// Fungsi untuk menampilkan detail transaksi
function showTransactionDetails(transaction) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  modalContent.innerHTML = `
    <div class="modal-header">
      <h3>Detail Transaksi</h3>
      <button class="close-btn">&times;</button>
    </div>
    <div class="receipt">
      <div class="receipt-header">
        <div>
          <div class="mono">No. Resi: ${transaction.id}</div>
          <div class="mono">Dibuat: ${new Date(transaction.timestamp).toLocaleString('id-ID')}</div>
        </div>
        <div>
          <strong>Total: ${formatIDR(transaction.charges.total)}</strong>
        </div>
      </div>

      <div class="kv">
        <div>Kendaraan</div>
        <div>${getVehicleLabel(transaction.vehicle)}</div>
        <div>Jam masuk</div>
        <div class="mono">${formatDateTime(new Date(transaction.entry))}</div>
        <div>Jam keluar</div>
        <div class="mono">${formatDateTime(new Date(transaction.exit))}</div>
        <div>Durasi</div>
        <div>
          ${(transaction.duration && typeof transaction.duration.days !== 'undefined') 
            ? `${transaction.duration.days} Hari ${transaction.duration.hours} Jam ${transaction.duration.minutes} Menit` 
            : `${Math.floor(transaction.duration.totalMinutes/1440)} Hari ${Math.floor((transaction.duration.totalMinutes%1440)/60)} Jam ${transaction.duration.totalMinutes%60} Menit`} 
          (${transaction.duration.totalMinutes} menit)
        </div>
        <div>Metode</div>
        <div>${transaction.methodLabel || '-'}</div>
      </div>

      ${transaction.explanation ? `<p class="mono" style="margin-top:10px">${transaction.explanation}</p>` : ''}

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
          ${transaction.charges.breakdown.map(row => `
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
            <td class="mono">${formatIDR(transaction.charges.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  // Tampilkan modal
  modal.style.display = 'block';
  
  // Tambahkan event listener untuk tombol tutup
  const closeBtn = modal.querySelector('.close-btn');
  closeBtn.addEventListener('click', function() {
    document.body.removeChild(modal);
  });
  
  // Tutup modal jika mengklik di luar konten
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });
  // Tutup dengan tombol ESC
  document.addEventListener('keydown', function onEsc(e){
    if (e.key === 'Escape') {
      if (document.body.contains(modal)) document.body.removeChild(modal);
      document.removeEventListener('keydown', onEsc);
    }
  });
}

// Fungsi untuk mendapatkan label kendaraan yang lebih deskriptif
function getVehicleLabel(vehicleType) {
  const vehicleLabels = {
    'mobil': 'Mobil',
    'motor': 'Motor',
    'box': 'Box',
    'valet_weekday': 'Valet Weekday',
    'valet_weekend': 'Valet Weekend'
  };
  
  return vehicleLabels[vehicleType] || vehicleType;
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
  // Jangan tampilkan riwayat otomatis di halaman utama
  const historyContainer = document.getElementById('transactionHistory');
  if (historyContainer) {
    // Render hanya jika kontainer ada dan diperlukan kemudian
    // (mis. setelah tombol Riwayat ditekan jika berada di halaman yang sama)
  }



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
}

function onPrint() {
  window.print();
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

// Tombol reset riwayat (digunakan di halaman history)
function clearTransactionHistory() {
  localStorage.setItem('parkingHistory', '[]');
}
window.clearTransactionHistory = clearTransactionHistory;