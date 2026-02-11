<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once 'db_config.php';

$prefix = $_GET['prefix'] ?? '';
$year = $_GET['year'] ?? '';
$userId = $_GET['userId'] ?? '';

if(empty($prefix) || empty($year) || empty($userId)) {
    echo json_encode([]);
    exit;
}

try {
    $query = "SELECT pi_id, activity_id, month_idx, value, activity_name, indicator_name, pi_title 
              FROM monitoring_data 
              WHERE prefix = :prefix AND year = :year AND user_id = :userId";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':prefix', $prefix);
    $stmt->bindParam(':year', $year);
    $stmt->bindParam(':userId', $userId);
    
    if($stmt->execute()) {
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results ? $results : []);
    } else {
        echo json_encode([]);
    }
} catch (PDOException $e) {
    // If table doesn't exist, return empty array instead of error to keep UI stable
    echo json_encode([]);
}
?>