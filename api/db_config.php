<?php
$host = "localhost";
$db_name = "u942025532_monitoring"; // Replace with your actual Hostinger DB Name
$username = "u942025532_monitoring";      // Replace with your actual Hostinger DB Username
$password = "Au2e2fb3sfb6";    // Replace with your actual Hostinger DB Password

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Connection error: " . $exception->getMessage()]);
    exit;
}
?>


