<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once 'db_config.php';

$raw_data = file_get_contents("php://input");
$data = json_decode($raw_data);

if(empty($data)) {
    echo json_encode(["status" => "error", "message" => "Empty payload received."]);
    exit;
}

if(!empty($data->prefix) && !empty($data->year) && !empty($data->userId) && !empty($data->piId) && !empty($data->activityId)) {
    try {
        $query = "INSERT INTO monitoring_data 
                  (prefix, year, user_id, pi_id, activity_id, month_idx, value, activity_name, indicator_name, pi_title) 
                  VALUES (:prefix, :year, :userId, :piId, :activityId, :monthIdx, :value, :actName, :indName, :piTitle)
                  ON DUPLICATE KEY UPDATE 
                  value = VALUES(value), 
                  activity_name = VALUES(activity_name), 
                  indicator_name = VALUES(indicator_name), 
                  pi_title = VALUES(pi_title)";

        $stmt = $conn->prepare($query);

        $stmt->bindParam(':prefix', $data->prefix);
        $stmt->bindParam(':year', $data->year);
        $stmt->bindParam(':userId', $data->userId);
        $stmt->bindParam(':piId', $data->piId);
        $stmt->bindParam(':activityId', $data->activityId);
        $stmt->bindParam(':monthIdx', $data->monthIdx);
        $stmt->bindParam(':value', $data->value);
        $stmt->bindParam(':actName', $data->activityName);
        $stmt->bindParam(':indName', $data->indicatorName);
        $stmt->bindParam(':piTitle', $data->piTitle);

        if($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            $errorInfo = $stmt->errorInfo();
            echo json_encode(["status" => "error", "message" => "Execute failed: " . $errorInfo[2]]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database Exception: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete parameters.", "received" => $data]);
}
?>