/**
 * features.js — Innovation Features
 * ParkMate Gandaria · AI + Web APIs
 * 
 * Features:
 *  1. Voice Command (Web Speech API)
 *  2. AI Vehicle Detection (TensorFlow COCO-SSD)
 *  3. QR Code Scanner (jsQR)
 *  4. AI Prediction (localStorage analytics)
 *  5. WhatsApp Share
 *  6. Save as Image (html2canvas)
 */

'use strict';

// ─── 1. VOICE COMMAND ─────────────────────────────────────────────
const VoiceCommand = (() => {
    let recognition = null;
    let isListening = false;

    const VehicleKeywords = {
        "mobil": "mobil",
        "motor": "motor",
        "sepeda motor": "motor",
        "box": "box",
        "truk": "box",
        "valet": "valet_weekday",
        "valet weekday": "valet_weekday",
        "valet weekend": "valet_weekend",
    };

    const parseVehicle = (text) => {
        const lower = text.toLowerCase();
        for (const [kw, val] of Object.entries(VehicleKeywords)) {
            if (lower.includes(kw)) return val;
        }
        return null;
    };

    const parseTime = (text) => {
        // Match "jam X pagi/siang/sore/malam" or "pukul X"
        const match = text.match(/(?:jam|pukul)\s+(\d{1,2})(?::(\d{2}))?\s*(pagi|siang|sore|malam)?/i);
        if (!match) return null;

        let hours = parseInt(match[1], 10);
        const mins = match[2] ? parseInt(match[2], 10) : 0;
        const period = (match[3] || "").toLowerCase();

        if (period === "sore" || period === "malam") hours = hours < 12 ? hours + 12 : hours;
        if (period === "pagi" && hours === 12) hours = 0;
        if (period === "siang" && hours < 12) hours += 12;

        const dt = new Date();
        dt.setHours(hours, mins, 0, 0);
        return dt;
    };

    const toLocalDatetimeValue = (date) => {
        if (!date) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const updateStatus = (msg) => {
        const el = document.getElementById("voiceStatusText");
        if (el) el.textContent = msg;
    };

    const processTranscript = (transcript) => {
        const text = transcript.toLowerCase();
        const vehicleSet = parseVehicle(text);
        const timeSet = parseTime(text);

        let filled = false;

        if (vehicleSet) {
            const sel = document.getElementById("vehicleType");
            if (sel) { sel.value = vehicleSet; filled = true; }
        }

        // "keluar" → exitTime, otherwise entryTime
        if (timeSet) {
            const isExit = text.includes("keluar");
            const fieldId = isExit ? "exitTime" : "entryTime";
            const field = document.getElementById(fieldId);
            if (field) { field.value = toLocalDatetimeValue(timeSet); filled = true; }
        }

        if (text.includes("hitung") || text.includes("kalkulasi")) {
            document.getElementById("parkingForm")?.dispatchEvent(new Event("submit", { cancelable: true }));
        }

        updateStatus(filled
            ? `✓ Terdeteksi: "${transcript.trim()}"`
            : `Tidak dipahami: "${transcript.trim()}". Coba "Mobil masuk jam 10 pagi"`
        );
    };

    const start = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Browser Anda tidak mendukung perintah suara. Gunakan Chrome terbaru.");
            return;
        }

        if (isListening) { stop(); return; }

        recognition = new SpeechRecognition();
        recognition.lang = "id-ID";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isListening = true;
            document.getElementById("voiceBtn")?.classList.add("listening");
            document.getElementById("voiceStatus")?.classList.remove("hidden");
            updateStatus("Mendengarkan... (bicara sekarang)");
        };

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            processTranscript(transcript);
        };

        recognition.onerror = (e) => {
            updateStatus(`Error: ${e.error}`);
            stop();
        };

        recognition.onend = () => stop();
        recognition.start();
    };

    const stop = () => {
        isListening = false;
        recognition?.stop();
        document.getElementById("voiceBtn")?.classList.remove("listening");
        setTimeout(() => {
            document.getElementById("voiceStatus")?.classList.add("hidden");
        }, 2500);
    };

    return { start };
})();


// ─── 2. AI VEHICLE DETECTION (TensorFlow COCO-SSD) ────────────────
const AICamera = (() => {
    let model = null;
    let stream = null;

    const VEHICLE_MAP = {
        car: "mobil",
        truck: "box",
        bus: "box",
        motorcycle: "motor",
        bicycle: "motor",
    };

    const loadModel = async () => {
        const statusEl = document.getElementById("modelLoadStatus");
        if (statusEl) statusEl.textContent = " (Memuat model AI...)";
        try {
            model = await cocoSsd.load();
            if (statusEl) statusEl.textContent = " ✓ Model siap.";
            document.getElementById("captureAiBtn")?.removeAttribute("disabled");
        } catch (err) {
            if (statusEl) statusEl.textContent = " ⚠ Gagal memuat model.";
            console.error("AI model load error:", err);
        }
    };

    const openCamera = async () => {
        const modal = document.getElementById("cameraModal");
        const video = document.getElementById("aiVideo");
        modal?.classList.remove("hidden");

        if (!model) loadModel();

        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
        } catch {
            alert("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
            closeCamera();
        }
    };

    const detect = async () => {
        if (!model) return alert("Model AI belum siap. Tunggu sebentar.");

        const video = document.getElementById("aiVideo");
        const canvas = document.getElementById("aiCanvas");
        const overlay = document.getElementById("aiDetectionOverlay");
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const predictions = await model.detect(canvas);
        const vehiclePreds = predictions.filter((p) => VEHICLE_MAP[p.class] && p.score > 0.4);

        if (vehiclePreds.length === 0) {
            overlay?.classList.remove("hidden");
            if (overlay) overlay.textContent = "⚠ Tidak ada kendaraan terdeteksi. Coba arahkan ulang.";
            return;
        }

        // Draw bboxes
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        vehiclePreds.forEach((p) => {
            const [x, y, w, h] = p.bbox;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 16px Outfit, sans-serif";
            ctx.fillText(`${p.class} (${Math.round(p.score * 100)}%)`, x + 4, y - 6);
        });

        const best = vehiclePreds[0];
        const vehicleVal = VEHICLE_MAP[best.class];
        const sel = document.getElementById("vehicleType");
        if (sel) {
            sel.value = vehicleVal;
            sel.dispatchEvent(new Event("change"));
        }

        overlay?.classList.remove("hidden");
        if (overlay) overlay.textContent = `✅ Terdeteksi: ${ParkMate.getVehicleLabel(vehicleVal)} (${Math.round(best.score * 100)}% yakin)`;

        setTimeout(() => { closeCamera(); }, 2000);
    };

    const closeCamera = () => {
        stream?.getTracks().forEach((t) => t.stop());
        stream = null;
        document.getElementById("cameraModal")?.classList.add("hidden");
        document.getElementById("aiDetectionOverlay")?.classList.add("hidden");
    };

    return { openCamera, detect, closeCamera };
})();


// ─── 3. QR SCANNER ────────────────────────────────────────────────
const QRScanner = (() => {
    let animFrame = null;
    let stream = null;

    const start = async () => {
        const video = document.getElementById("qrVideo");
        const canvas = document.getElementById("qrCanvas");
        const resultEl = document.getElementById("scanResult");
        const startBtn = document.getElementById("startScanBtn");
        const stopBtn = document.getElementById("stopScanBtn");

        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            video.play();
        } catch {
            alert("Tidak dapat mengakses kamera. Pastikan izin telah diberikan.");
            return;
        }

        startBtn?.classList.add("hidden");
        stopBtn?.classList.remove("hidden");
        if (resultEl) resultEl.classList.add("hidden");

        const tick = () => {
            if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                animFrame = requestAnimationFrame(tick);
                return;
            }

            const ctx = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = typeof jsQR !== "undefined" ? jsQR(imageData.data, canvas.width, canvas.height) : null;

            if (code) {
                handleQRResult(code.data, resultEl);
                stop();
                return;
            }
            animFrame = requestAnimationFrame(tick);
        };
        animFrame = requestAnimationFrame(tick);
    };

    const stop = () => {
        cancelAnimationFrame(animFrame);
        stream?.getTracks().forEach((t) => t.stop());
        stream = null;
        document.getElementById("startScanBtn")?.classList.remove("hidden");
        document.getElementById("stopScanBtn")?.classList.add("hidden");
    };

    const handleQRResult = (raw, resultEl) => {
        try {
            const data = JSON.parse(raw);
            const entry = new Date(data.e);
            const now = new Date();

            // Set form fields automatically
            const toVal = (d) => {
                const pad = (n) => String(n).padStart(2, "0");
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };

            const vehicleSel = document.getElementById("vehicleType");
            const entryInput = document.getElementById("entryTime");
            const exitInput = document.getElementById("exitTime");

            if (vehicleSel) vehicleSel.value = data.v;
            if (entryInput) entryInput.value = toVal(entry);
            if (exitInput) exitInput.value = toVal(now);

            if (resultEl) {
                resultEl.classList.remove("hidden");
                resultEl.innerHTML = `<strong>✅ QR Berhasil Dibaca!</strong><br>Kendaraan: ${ParkMate.getVehicleLabel(data.v)}<br>Masuk: ${ParkMate.formatDateTime(entry)}<br>Formulir telah diisi otomatis. Lanjut ke tab Hitung Tarif.`;
            }

            // Switch to form tab
            ParkMate.setActiveTab("tab-hitung");
            ParkMate.showSection("formSection");
            document.getElementById("tab-hitung")?.click();

        } catch {
            if (resultEl) {
                resultEl.classList.remove("hidden");
                resultEl.textContent = "⚠ QR tidak valid atau bukan tiket parkir.";
            }
        }
    };

    return { start, stop };
})();


// ─── 4. AI PREDICTION (localStorage analytics) ────────────────────
const AIPrediction = (() => {
    const analyze = () => {
        const history = JSON.parse(localStorage.getItem("parkingHistory") || "[]");
        if (history.length < 3) return; // Need minimum data

        // Count transactions per hour of day
        const hourCounts = new Array(24).fill(0);
        history.forEach((tx) => {
            const h = new Date(tx.timestamp).getHours();
            hourCounts[h]++;
        });

        const currentHour = new Date().getHours();
        const avgCount = hourCounts.reduce((a, b) => a + b, 0) / 24;
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        const quietHour = hourCounts.indexOf(Math.min(...hourCounts.filter(c => c > 0)));

        const banner = document.getElementById("predictionBanner");
        const msgEl = document.getElementById("predictionMsg");
        if (!banner || !msgEl) return;

        let msg = "";
        const currentLoad = hourCounts[currentHour];

        if (currentLoad > avgCount * 1.5) {
            msg = `Jam sekarang (${currentHour}:00) diprediksi padat. Jam paling ramai biasanya pukul ${peakHour}:00.`;
        } else if (currentLoad < avgCount * 0.5) {
            msg = `Saat ini relatif sepi. Jam tersibuk biasanya pukul ${peakHour}:00.`;
        } else {
            msg = `Volume normal sekarang. Jam paling sepi biasanya pukul ${quietHour !== undefined ? quietHour : "-"}:00.`;
        }

        msgEl.textContent = msg;
        banner.classList.remove("hidden");
    };

    return { analyze };
})();


// ─── 5. WHATSAPP SHARE ────────────────────────────────────────────
const shareToWhatsApp = () => {
    const data = window.__lastReceiptData;
    if (!data) return alert("Tampilkan resi dahulu.");

    const { breakdown, entry, exit, vehicle } = data;
    const id = window.__lastReceiptId || "PKR-" + Date.now();

    const msg =
        `*Resi Parkir Gandaria City*\n` +
        `No. Resi : ${id}\n` +
        `Kendaraan: ${ParkMate.getVehicleLabel(vehicle)}\n` +
        `Masuk    : ${ParkMate.formatDateTime(entry)}\n` +
        `Keluar   : ${ParkMate.formatDateTime(exit)}\n` +
        `Durasi   : ${breakdown.durDays}h ${breakdown.durHoursRem}j ${breakdown.durMins}m\n` +
        `─────────────────────────\n` +
        `*Total Bayar: ${ParkMate.formatIDR(breakdown.totalCharge)}*`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
};


// ─── 6. SAVE AS IMAGE (html2canvas) ──────────────────────────────
const saveAsImage = async () => {
    const target = document.getElementById("receiptPrintArea");
    if (!target) return alert("Resi belum tersedia.");
    if (typeof html2canvas === "undefined") return alert("Library belum siap, coba lagi.");

    try {
        const canvas = await html2canvas(target, {
            backgroundColor: "#1e1b4b",
            scale: 2,
            useCORS: true,
        });
        const link = document.createElement("a");
        link.download = `resi-parkir-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    } catch (err) {
        alert("Gagal menyimpan gambar: " + err.message);
    }
};


// ─── INIT (wires all features to DOM) ────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
    // Voice
    document.getElementById("voiceBtn")?.addEventListener("click", VoiceCommand.start);

    // AI Camera
    document.getElementById("cameraBtn")?.addEventListener("click", AICamera.openCamera);
    document.getElementById("captureAiBtn")?.addEventListener("click", AICamera.detect);
    document.getElementById("closeCameraModal")?.addEventListener("click", AICamera.closeCamera);
    document.getElementById("cameraModal")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("cameraModal")) AICamera.closeCamera();
    });

    // QR Scanner
    document.getElementById("startScanBtn")?.addEventListener("click", QRScanner.start);
    document.getElementById("stopScanBtn")?.addEventListener("click", QRScanner.stop);

    // Share
    document.getElementById("shareWaBtn")?.addEventListener("click", shareToWhatsApp);
    document.getElementById("saveImgBtn")?.addEventListener("click", saveAsImage);

    // AI Prediction
    AIPrediction.analyze();

    // ESC closes camera modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") AICamera.closeCamera();
    });
});
