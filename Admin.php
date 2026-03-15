<?php
session_start();


if (!isset($_SESSION['login']) || $_SESSION['login'] !== true) {
  header("Location: login.php");
  exit;
}

$pesan_sukses = $_SESSION['pesan_sukses'] ?? "";
unset($_SESSION['pesan_sukses']);

$dataFile = 'data.json';

if (!file_exists($dataFile)) {
  file_put_contents($dataFile, json_encode([]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_ship'])) {
  $ships = json_decode(file_get_contents($dataFile), true) ?? [];

  $newShip = [
    'id'       => $_POST['ship_id'],
    'name'     => $_POST['ship_name'],
    'type'     => $_POST['ship_type'],
    'speed'    => $_POST['ship_speed'],
    'position' => $_POST['ship_position'],
    'status'   => 'Aktif'
  ];

  $ships[] = $newShip;
  file_put_contents($dataFile, json_encode($ships, JSON_PRETTY_PRINT));

  $_SESSION['pesan_sukses_ship'] = "Kapal berhasil ditambahkan!";
  header("Location: Admin.php");
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_ship'])) {
  $deleteId = $_POST['delete_id'];
  $ships = json_decode(file_get_contents($dataFile), true) ?? [];

  $ships = array_values(array_filter($ships, function($ship) use ($deleteId) {
    return $ship['id'] !== $deleteId;
  }));

  file_put_contents($dataFile, json_encode($ships, JSON_PRETTY_PRINT));

  $_SESSION['pesan_sukses_ship'] = "Kapal berhasil dihapus!";
  header("Location: Admin.php");
  exit;
}

$ships = json_decode(file_get_contents($dataFile), true) ?? [];
?>
<!DOCTYPE html>
<html lang="id">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Maritim Kupang - Admin Dashboard</title>
  <link rel="stylesheet" href="Admin.css">
  <style>
    .btn-danger {
      background-color: #e53e3e;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-danger:hover {
      background-color: #c53030;
    }
    .alert-success {
      background-color: #c6f6d5;
      color: #276749;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-weight: 500;
    }
  </style>
</head>

<body>

  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>SMART MARITIM KUPANG</h1>
    </div>
    <nav class="nav-section">
      <ul class="nav-menu">
        <li><a href="#dashboard" class="nav-link active">Dashboard</a></li>
      </ul>
    </nav>
    <div class="user-info">
      <div class="user-avatar">A</div>
      <div>
        <div class="user-name">Admin</div>
        <div class="user-role">Administrator</div>
      </div>
    </div>
  </aside>

  <main class="main-content">
    <div id="dashboard" class="page active">
      <div class="page-header">
        <h2>Dashboard Admin</h2>
        <p>Selamat datang di dashboard admin Smart Maritim Kupang!</p>
      </div>

      <!-- Flash Message -->
      <?php if (!empty($_SESSION['pesan_sukses_ship'])): ?>
        <div class="alert-success">
          <?= htmlspecialchars($_SESSION['pesan_sukses_ship']) ?>
        </div>
        <?php unset($_SESSION['pesan_sukses_ship']); ?>
      <?php endif; ?>

      <!-- FORM TAMBAH KAPAL -->
      <div class="card">
        <div class="card-header">
          <h3>Tambah Kapal Baru</h3>
        </div>
        <div class="card-body">
          <form method="POST">
            <input type="text" name="ship_id" placeholder="ID Kapal" required>
            <input type="text" name="ship_name" placeholder="Nama Kapal" required>
            <select name="ship_type">
              <option value="Patrol">Patrol</option>
              <option value="Cargo">Cargo</option>
              <option value="Ferry">Ferry</option>
            </select>
            <input type="text" name="ship_speed" placeholder="Kecepatan (kn)" required>
            <input type="text" name="ship_position" placeholder="Posisi (lat,long)" required>
            <button type="submit" name="add_ship" class="btn-primary">Tambah Kapal</button>
          </form>
        </div>
      </div>

      <!-- DAFTAR KAPAL -->
      <div class="card">
        <div class="card-header">
          <h3>Daftar Kapal</h3>
        </div>
        <div class="card-body">
          <?php if (empty($ships)): ?>
            <p>Belum ada data kapal.</p>
          <?php else: ?>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama</th>
                  <th>Tipe</th>
                  <th>Kecepatan</th>
                  <th>Posisi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($ships as $ship): ?>
                  <tr>
                    <td><strong><?= htmlspecialchars($ship['id']) ?></strong></td>
                    <td><?= htmlspecialchars($ship['name']) ?></td>
                    <td>⚓ <?= htmlspecialchars($ship['type']) ?></td>
                    <td><?= htmlspecialchars($ship['speed']) ?></td>
                    <td><?= htmlspecialchars($ship['position']) ?></td>
                    <td><?= htmlspecialchars($ship['status']) ?></td>
                    <td>
                      <!-- Tombol Hapus -->
                      <form method="POST" onsubmit="return confirm('Yakin ingin menghapus kapal <?= htmlspecialchars($ship['name']) ?>?')">
                        <input type="hidden" name="delete_id" value="<?= htmlspecialchars($ship['id']) ?>">
                        <button type="submit" name="delete_ship" class="btn-danger">🗑 Hapus</button>
                      </form>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          <?php endif; ?>
        </div>
      </div>

    </div>
  </main>

</body>

</html>