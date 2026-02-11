<?php
header("Content-Type: application/json; charset=UTF-8");
include_once 'db_config.php';

try {
    // SQL statement to create the monitoring_data table
    $sql = "CREATE TABLE IF NOT EXISTS monitoring_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        prefix VARCHAR(50) NOT NULL,
        year VARCHAR(10) NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        pi_id VARCHAR(50) NOT NULL,
        activity_id VARCHAR(100) NOT NULL,
        month_idx INT NOT NULL,
        value INT DEFAULT 0,
        activity_name TEXT,
        indicator_name TEXT,
        pi_title TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX unique_cell (prefix, year, user_id, pi_id, activity_id, month_idx)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $conn->exec($sql);

    echo json_encode([
        "status" => "success",
        "message" => "Database table 'monitoring_data' is ready.",
        "details" => [
            "database" => $db_name,
            "table_created" => true,
            "unique_index" => "active"
        ]
    ]);
} catch(PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Table creation failed: " . $e->getMessage()
    ]);
}
?>