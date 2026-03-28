<?php
$conn = mysqli_connect("localhost", "root", "", "smart_maritim");
if (!$conn) {
    die("Koneksi gagal: " . mysqli_connect_error());
}
?>