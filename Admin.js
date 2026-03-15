/* =========================
   LOGIN GUARD (ADMIN ONLY)
========================= */
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "admin") {
  window.location.href = "../login.html";
}

console.log("✅ Login valid sebagai Admin:", currentUser.username);

/* =========================
   LOGOUT
========================= */
function logout() {
  localStorage.removeItem("isLogin");
  localStorage.removeItem("currentUser");
  window.location.href = "../login.html";
}

/* =========================
   NAVIGATION
========================= */
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));

  document.getElementById(pageId)?.classList.add("active");
  document.querySelector(`a[href="#${pageId}"]`)?.classList.add("active");
  
  console.log("📄 Navigasi ke:", pageId);
}

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    showPage(link.getAttribute("href").substring(1));
  });
});

window.addEventListener("popstate", () => {
  showPage(location.hash.replace("#", "") || "dashboard");
});

/* =========================
   DATA STORAGE
========================= */
let catches = JSON.parse(localStorage.getItem("catches")) || [];
let fishPrices = JSON.parse(localStorage.getItem("fishPrices")) || [];
let wastes = JSON.parse(localStorage.getItem("wastes")) || [];
let weatherData = JSON.parse(localStorage.getItem("weatherData")) || {
  windSpeed: 15,
  waveHeight: 1.2,
  visibility: "Baik",
  currentCondition: "Cuaca cerah, aman untuk berlayar",
  warning: "Potensi hujan ringan sore hari"
};

let parkingSlots = JSON.parse(localStorage.getItem("parkingSlots")) ||
  Array.from({ length: 25 }, (_, i) => ({
    id: `${String.fromCharCode(65 + Math.floor(i / 5))}${(i % 5) + 1}`,
    occupied: i < 18
  }));

/* =========================
   ARSIP TANGKAPAN
========================= */
function saveCatch() {
  const vessel = document.getElementById("catch-vessel").value;
  const fish = document.getElementById("catch-fish").value;
  const weight = document.getElementById("catch-weight").value;
  const location = document.getElementById("catch-location").value;

  if (!vessel || !weight || !location) {
    alert("❌ Lengkapi semua data!");
    return;
  }

  const newCatch = {
    time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    vessel, 
    fish, 
    weight: parseInt(weight), 
    location
  };

  catches.unshift(newCatch);
  localStorage.setItem("catches", JSON.stringify(catches));
  
  renderCatchTable();
  
  // Reset form
  document.getElementById("catch-vessel").value = "";
  document.getElementById("catch-weight").value = "";
  document.getElementById("catch-location").value = "";
  
  alert("✅ Data tangkapan berhasil disimpan!");
  console.log("📦 Data tangkapan tersimpan:", newCatch);
}

function renderCatchTable() {
  const tbody = document.getElementById("catch-table-body");
  if (!tbody) return;

  if (catches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada data</td></tr>';
    return;
  }

  tbody.innerHTML = catches.map((c, index) => `
    <tr>
      <td>${c.time}</td>
      <td>${c.vessel}</td>
      <td>${c.fish}</td>
      <td>${c.weight} kg</td>
      <td>${c.location}</td>
      <td>
        <button onclick="deleteCatch(${index})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑️ Hapus</button>
      </td>
    </tr>
  `).join("");
}

function deleteCatch(index) {
  if (!confirm("Hapus data tangkapan ini?")) return;
  
  catches.splice(index, 1);
  localStorage.setItem("catches", JSON.stringify(catches));
  renderCatchTable();
  alert("✅ Data berhasil dihapus!");
}

/* =========================
   FISH PRICE (AUTO SYNC KE USER)
========================= */
function addFishPrice(e) {
  e.preventDefault();

  const name = document.getElementById("fish-name").value;
  const price = document.getElementById("fish-price").value;
  const quality = document.getElementById("fish-quality").value;

  if (!name || !price) {
    alert("❌ Lengkapi data!");
    return;
  }

  const newFish = {
    name: name,
    price: parseInt(price),
    quality: quality,
    status: "Normal"
  };

  fishPrices.push(newFish);
  localStorage.setItem("fishPrices", JSON.stringify(fishPrices));
  
  renderFishPrice();
  updateFishStats();
  e.target.reset();
  
  alert(`✅ Harga ${name} berhasil ditambahkan!`);
  console.log("🐟 Harga ikan tersimpan:", newFish);
}

function renderFishPrice() {
  const table = document.getElementById("fish-price-table");
  if (!table) return;

  if (fishPrices.length === 0) {
    table.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada data</td></tr>';
    return;
  }

  table.innerHTML = fishPrices.map((f, i) => {
    const statusClass = f.status === "Naik" ? "active" : f.status === "Turun" ? "warning" : "idle";
    return `
      <tr>
        <td>${f.name}</td>
        <td>Rp ${parseInt(f.price).toLocaleString("id-ID")}</td>
        <td>${f.quality || "Grade B"}</td>
        <td><span class="status-badge ${statusClass}">${f.status || "Normal"}</span></td>
        <td>
          <button onclick="editFishPrice(${i})" style="background:#06b6d4; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:4px;">✏️ Edit</button>
          <button onclick="deleteFishPrice(${i})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑️ Hapus</button>
        </td>
      </tr>
    `;
  }).join("");
}

function updateFishStats() {
  if (fishPrices.length === 0) {
    const cards = document.querySelectorAll("#fishprice .stat-card-value");
    if (cards[0]) cards[0].textContent = "Rp 0";
    if (cards[1]) cards[1].textContent = "Rp 0";
    if (cards[2]) cards[2].textContent = "Rp 0";
    return;
  }

  const prices = fishPrices.map(f => parseInt(f.price));
  const highest = Math.max(...prices);
  const lowest = Math.min(...prices);
  const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  const cards = document.querySelectorAll("#fishprice .stat-card-value");
  if (cards[0]) cards[0].textContent = `Rp ${highest.toLocaleString("id-ID")}`;
  if (cards[1]) cards[1].textContent = `Rp ${lowest.toLocaleString("id-ID")}`;
  if (cards[2]) cards[2].textContent = `Rp ${average.toLocaleString("id-ID")}`;
}

function editFishPrice(index) {
  const fish = fishPrices[index];
  
  const newPrice = prompt(`Edit harga ${fish.name}\n\nHarga sekarang: Rp ${parseInt(fish.price).toLocaleString("id-ID")}\n\nMasukkan harga baru:`, fish.price);
  
  if (newPrice && !isNaN(newPrice) && parseInt(newPrice) > 0) {
    const oldPrice = fishPrices[index].price;
    fishPrices[index].price = parseInt(newPrice);
    
    // Update status otomatis
    if (parseInt(newPrice) > oldPrice) {
      fishPrices[index].status = "Naik";
    } else if (parseInt(newPrice) < oldPrice) {
      fishPrices[index].status = "Turun";
    } else {
      fishPrices[index].status = "Stabil";
    }
    
    localStorage.setItem("fishPrices", JSON.stringify(fishPrices));
    renderFishPrice();
    updateFishStats();
    alert(`✅ Harga ${fish.name} berhasil diupdate!`);
    console.log("🐟 Harga diupdate:", fishPrices[index]);
  }
}

function deleteFishPrice(i) {
  if (!confirm(`Hapus data ${fishPrices[i].name}?`)) return;
  
  fishPrices.splice(i, 1);
  localStorage.setItem("fishPrices", JSON.stringify(fishPrices));
  renderFishPrice();
  updateFishStats();
  alert("✅ Data berhasil dihapus!");
}

/* =========================
   LIMBAH LAUT (AUTO SYNC KE USER)
========================= */
function addWaste(e) {
  e.preventDefault();

  const type = document.getElementById("waste-type").value;
  const location = document.getElementById("waste-location").value;

  if (!type || !location) {
    alert("❌ Lengkapi data!");
    return;
  }

  const newWaste = {
    type: type,
    location: location,
    timestamp: new Date().toISOString()
  };

  wastes.push(newWaste);
  localStorage.setItem("wastes", JSON.stringify(wastes));
  
  renderWaste();
  renderWasteStats();
  e.target.reset();
  
  alert(`✅ Data limbah ${type} berhasil ditambahkan!`);
  console.log("🗑️ Limbah tersimpan:", newWaste);
}

function renderWaste() {
  const list = document.getElementById("waste-list");
  if (!list) return;

  if (wastes.length === 0) {
    list.innerHTML = '<li style="color:#bae6fd; padding:20px; text-align:center;">Belum ada data limbah</li>';
    return;
  }

  list.innerHTML = wastes.map((w, i) => `
    <li style="margin-bottom:12px; padding:12px; background:rgba(255,255,255,0.1); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
      <span>🗑️ <strong>${w.type}</strong> - ${w.location}</span>
      <button onclick="deleteWaste(${i})" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">🗑️ Hapus</button>
    </li>
  `).join("");
}

function renderWasteStats() {
  const container = document.getElementById("waste-stats");
  if (!container) return;

  // Hitung total per jenis
  let organik = 0, plastik = 0, minyak = 0;
  
  wastes.forEach(w => {
    const type = w.type.toLowerCase();
    if (type.includes("organik")) organik++;
    else if (type.includes("plastik")) plastik++;
    else if (type.includes("minyak") || type.includes("oli")) minyak++;
  });

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-title">Organik</div>
      <div class="stat-card-value green">${organik}</div>
      <div class="stat-card-label">Laporan</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-title">Plastik</div>
      <div class="stat-card-value yellow">${plastik}</div>
      <div class="stat-card-label">Laporan</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-title">Minyak/Oli</div>
      <div class="stat-card-value red">${minyak}</div>
      <div class="stat-card-label">Laporan</div>
    </div>
  `;
}

function deleteWaste(i) {
  if (!confirm(`Hapus data limbah ${wastes[i].type}?`)) return;
  
  wastes.splice(i, 1);
  localStorage.setItem("wastes", JSON.stringify(wastes));
  renderWaste();
  renderWasteStats();
  alert("✅ Data berhasil dihapus!");
}

function laporanLimbah() {
  if (wastes.length === 0) {
    alert("Belum ada data limbah untuk dilaporkan.");
    return;
  }

  const now = new Date().toLocaleDateString("id-ID", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });

  let report = `
═══════════════════════════════════════
   📋 LAPORAN LIMBAH PELABUHAN KUPANG
═══════════════════════════════════════

📅 Tanggal: ${now}

📊 DAFTAR LIMBAH:
`;

  wastes.forEach((w, i) => {
    report += `\n${i + 1}. ${w.type} - ${w.location}`;
  });

  report += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 Total laporan: ${wastes.length}`;

  alert(report);
}

/* =========================
   MARINE WEATHER MANAGEMENT
========================= */

/* ======================================
   MARINE WEATHER STORAGE
====================================== */
function getMarineWeather() {
  return JSON.parse(localStorage.getItem("marineWeather")) || null;
}

function saveMarineWeather(data) {
  localStorage.setItem("marineWeather", JSON.stringify(data));
}

/* ======================================
   SIMPAN DATA DARI FORM
====================================== */
function simpanWeather(event) {
  event.preventDefault(); // PENTING: cegah reload

  const wind = document.getElementById("weather-wind").value;
  const wave = document.getElementById("weather-wave").value;
  const visibility = document.getElementById("weather-visibility").value;
  const condition = document.getElementById("weather-condition").value;
  const warning = document.getElementById("weather-warning").value;

  if (!wind || !wave) {
    alert("Kecepatan angin dan tinggi gelombang wajib diisi!");
    return;
  }

  const weatherData = {
    wind,
    wave,
    visibility,
    condition,
    warning,
    updatedAt: new Date().toLocaleString()
  };

  saveMarineWeather(weatherData);
  renderMarineWeather();

  alert("✅ Data cuaca berhasil disimpan & tampil ke user");
}

/* ======================================
   RENDER KE DASHBOARD & USER
====================================== */
function renderMarineWeather() {
  const data = getMarineWeather();
  if (!data) return;

  // Statistik Ringkas
  document.getElementById("stat-wind").innerText = data.wind;
  document.getElementById("stat-wave").innerText = data.wave;
  document.getElementById("stat-visibility").innerText = data.visibility;

  // Warna visibility
  const visEl = document.getElementById("stat-visibility");
  visEl.classList.remove("green", "yellow", "red");

  if (data.visibility === "Baik") visEl.classList.add("green");
  if (data.visibility === "Sedang") visEl.classList.add("yellow");
  if (data.visibility === "Buruk") visEl.classList.add("red");

  // Preview yang dilihat user
  document.getElementById("preview-condition").innerText =
    data.condition || "-";

  document.getElementById("preview-warning").innerText =
    data.warning || "-";
}

/* ======================================
   AUTO LOAD SAAT HALAMAN DIBUKA
====================================== */
document.addEventListener("DOMContentLoaded", renderMarineWeather);

/* =========================
   PARKING SYSTEM
========================= */
function toggleParking(id) {
  const slot = parkingSlots.find(s => s.id === id);
  if (!slot) return;

  slot.occupied = !slot.occupied;
  localStorage.setItem("parkingSlots", JSON.stringify(parkingSlots));
  renderParking();
  
  console.log(` Slot ${id} ${slot.occupied ? "terisi" : "kosong"}`);
}

function renderParking() {
  const grid = document.getElementById("parking-grid");
  if (!grid) return;

  grid.innerHTML = parkingSlots.map(s => `
    <div class="parking-slot ${s.occupied ? "occupied" : "available"}"
         onclick="toggleParking('${s.id}')"
         style="cursor:pointer;">
      <div style="font-size: 24px;">${s.occupied ? "" : "✓"}</div>
      <div style="margin-top: 8px; font-weight: 600;">${s.id}</div>
    </div>
  `).join("");

  // Update stats
  const occupied = parkingSlots.filter(s => s.occupied).length;
  const available = parkingSlots.length - occupied;
  
  const stats = document.querySelectorAll("#parkir .stat-card-value");
  if (stats[0]) stats[0].textContent = parkingSlots.length;
  if (stats[1]) stats[1].textContent = occupied;
  if (stats[2]) stats[2].textContent = available;
}

/* =========================
   BERITA MANAGEMENT
========================= */

/* =========================
   BERITA MANAGEMENT
========================= */
// Preview gambar dari URL
function previewImageFromUrl() {
  const imageUrl = document.getElementById("news-image-url").value;
  const preview = document.getElementById("previewImg");
  
  if (imageUrl) {
    preview.src = imageUrl;
    preview.style.display = "block";
    
    // Cek jika gambar gagal load
    preview.onerror = function() {
      alert("❌ Gambar tidak dapat dimuat. Pastikan URL gambar benar!");
      preview.style.display = "none";
    };
  } else {
    preview.style.display = "none";
  }
}

function addNews(event) {
  event.preventDefault();
  console.log("Form submitted");
  
  const title = document.getElementById("news-title").value;
  const category = document.getElementById("news-category").value;
  const date = document.getElementById("news-date").value;
  const content = document.getElementById("news-content").value || "Baca selengkapnya di link artikel";
  const berita = document.getElementById("news-berita").value;
  const url = document.getElementById("news-url").value;
  const imageUrl = document.getElementById("news-image-url").value; // ✅ Ambil URL gambar

  if (!title || !category || !date || !berita || !url || !imageUrl) {
    alert("❌ Lengkapi semua data wajib (bertanda *)!");
    return;
  }

  const newNews = {
    id: Date.now(),
    time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    title,
    category,
    date,
    content,
    berita,
    url,
    image: imageUrl, // ✅ Simpan URL gambar langsung (bukan Base64)
    author: "Admin"
  };

  let newsData = JSON.parse(localStorage.getItem("news")) || [];
  newsData.unshift(newNews);
  localStorage.setItem("news", JSON.stringify(newsData));
  
  console.log("✅ Data disimpan:", newNews);
  console.log("📦 Total berita:", newsData.length);
  
  renderNewsTable();
  
  // Reset form
  document.getElementById("news-title").value = "";
  document.getElementById("news-category").value = "";
  document.getElementById("news-date").value = "";
  document.getElementById("news-content").value = "";
  document.getElementById("news-berita").value = "";
  document.getElementById("news-url").value = "";
  document.getElementById("news-image-url").value = ""; // ✅ Reset URL gambar
  document.getElementById("previewImg").style.display = "none";
  
  alert("✅ Berita berhasil disimpan!");
}

function renderNewsTable() {
  const tbody = document.getElementById("news-table-body");
  if (!tbody) return;

  let newsData = JSON.parse(localStorage.getItem("news")) || [];

  if (newsData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada data</td></tr>';
    return;
  }

  tbody.innerHTML = newsData.map((c, index) => `
    <tr>
      <td><img src="${c.image}" alt="${c.title}" style="width:80px; height:60px; object-fit:cover; border-radius:4px;"></td>
      <td>${c.title}</td>
      <td><span style="background:#e3f2fd; color:#1976d2; padding:4px 8px; border-radius:4px; font-size:12px;">${c.category}</span></td>
      <td><a href="${c.url}" target="_blank" style="color:#0066cc;">🔗 Buka</a></td>
      <td>
        <button onclick="deleteNews(${index})" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">🗑️ Hapus</button>
      </td>
    </tr>
  `).join("");
}

function deleteNews(index) {
  if (confirm("Hapus berita ini?")) {
    let newsData = JSON.parse(localStorage.getItem("news")) || [];
    newsData.splice(index, 1);
    localStorage.setItem("news", JSON.stringify(newsData));
    renderNewsTable();
    alert("✅ Berita berhasil dihapus!");
  }
}

// Load data saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
  renderNewsTable();
});

// Fungsi untuk Update Admin Credentials
function updateAdmin(event) {
  event.preventDefault();
  
  const username = document.getElementById('admin-user').value;
  const password = document.getElementById('admin-pass').value;
  
  if (!username && !password) {
    alert('⚠️ Masukkan username atau password yang ingin diubah!');
    return;
  }
  
  // Simulasi update (ganti dengan logic backend Anda)
  if (username) {
    console.log('Username diubah menjadi:', username);
  }
  if (password) {
    console.log('Password telah diubah');
  }
  
  alert('✅ Credentials admin berhasil diupdate!');
  document.getElementById('adminForm').reset();
}

// Fungsi untuk Tambah Akun Baru
function addAccount(event) {
  event.preventDefault();
  
  const username = document.getElementById('new-username').value;
  const password = document.getElementById('new-password').value;
  const role = document.getElementById('new-role').value;
  const email = document.getElementById('new-email').value || '-';
  const status = document.getElementById('new-status').value;
  
  // Get current date
  const today = new Date();
  const tanggalDaftar = today.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  // Get table body
  const tableBody = document.getElementById('account-table');
  const rowCount = tableBody.rows.length + 1;
  
  // Create new row
  const newRow = tableBody.insertRow();
  newRow.innerHTML = `
    <td><strong>${rowCount}</strong></td>
    <td>${username}</td>
    <td>${email}</td>
    <td>${role}</td>
    <td>${tanggalDaftar}</td>
    <td><span class="status-badge ${status === 'Aktif' ? 'active' : 'idle'}">${status}</span></td>
    <td>
      <button onclick="editAccount(this)" class="btn-edit" style="padding: 5px 10px; margin-right: 5px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">✏️ Edit</button>
      <button onclick="deleteAccount(this)" class="btn-delete" style="padding: 5px 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Hapus</button>
    </td>
  `;
  
  alert('✅ Akun berhasil ditambahkan!');
  document.getElementById('addAccountForm').reset();
}

// Fungsi untuk Edit Akun
function editAccount(button) {
  const row = button.closest('tr');
  const cells = row.cells;
  
  const username = cells[1].textContent;
  const email = cells[2].textContent;
  const role = cells[3].textContent;
  const status = cells[5].querySelector('.status-badge').textContent;
  
  // Populate form dengan data yang ada
  document.getElementById('new-username').value = username;
  document.getElementById('new-email').value = email !== '-' ? email : '';
  document.getElementById('new-role').value = role;
  document.getElementById('new-status').value = status;
  
  // Scroll ke form
  document.querySelector('#addAccountForm').scrollIntoView({ behavior: 'smooth' });
  
  // Hapus row lama setelah edit
  setTimeout(() => {
    if (confirm('Data sudah terisi di form. Hapus data lama dari tabel?')) {
      row.remove();
      updateRowNumbers();
    }
  }, 500);
}

// Fungsi untuk Hapus Akun
function deleteAccount(button) {
  if (confirm('⚠️ Yakin ingin menghapus akun ini?')) {
    const row = button.closest('tr');
    row.remove();
    updateRowNumbers();
    alert('✅ Akun berhasil dihapus!');
  }
}

// Fungsi untuk Update Nomor Urut
function updateRowNumbers() {
  const tableBody = document.getElementById('account-table');
  const rows = tableBody.rows;
  
  for (let i = 0; i < rows.length; i++) {
    rows[i].cells[0].innerHTML = `<strong>${i + 1}</strong>`;
  }
}

// Load data awal (contoh data dummy)
window.addEventListener('DOMContentLoaded', function() {
  // Tambahkan data admin default
  const tableBody = document.getElementById('account-table');
  tableBody.innerHTML = `
    <tr>
      <td><strong>1</strong></td>
      <td>admin</td>
      <td>admin@smartmaritim.id</td>
      <td>Administrator</td>
      <td>1 Januari 2024</td>
      <td><span class="status-badge active">Aktif</span></td>
      <td>
        <button onclick="editAccount(this)" class="btn-edit" style="padding: 5px 10px; margin-right: 5px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">✏️ Edit</button>
        <button onclick="deleteAccount(this)" class="btn-delete" style="padding: 5px 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Hapus</button>
      </td>
    </tr>
  `;
});
/* =========================
   INIT
========================= */
function init() {
  console.log("🚀 Admin Dashboard - Full Access Mode");
  
  renderCatchTable();
  renderFishPrice();
  updateFishStats();
  renderWaste();
  renderWasteStats();
  renderParking();
  renderWeatherData();
  
  console.log("✅ Semua fitur admin aktif");
  console.log("📊 Data Statistics:");
  console.log("   - Tangkapan:", catches.length);
  console.log("   - Harga Ikan:", fishPrices.length);
  console.log("   - Limbah:", wastes.length);
  console.log("   - Cuaca Maritim:", weatherData.lastUpdate || "Default");
}

/* =========================
   START APP
========================= */
window.addEventListener("DOMContentLoaded", () => {
  showPage(location.hash.replace("#", "") || "dashboard");
  init();
});

console.log("✅ Admin.js loaded - FULL ACCESS MODE");

function updateStats() {
  const filterValue = document.getElementById("fish-filter").value;

  let data = fishPrices;
  if (filterValue) {
    data = fishPrices.filter(f => f.name === filterValue);
  }

  if (data.length === 0) {
    setStat("highest-price", 0);
    setStat("lowest-price", 0);
    setStat("average-price", 0);
    document.getElementById("highest-fish-name").innerText = "-";
    document.getElementById("lowest-fish-name").innerText = "-";
    return;
  }

  const highest = data.reduce((a, b) => a.price > b.price ? a : b);
  const lowest = data.reduce((a, b) => a.price < b.price ? a : b);

  setStat("highest-price", highest.price);
  setStat("lowest-price", lowest.price);

  document.getElementById("highest-fish-name").innerText = highest.name;
  document.getElementById("lowest-fish-name").innerText = lowest.name;

  const avg = data.reduce((sum, f) => sum + f.price, 0) / data.length;
  setStat("average-price", Math.round(avg));
}