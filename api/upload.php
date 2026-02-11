<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$root_dir = $_SERVER['DOCUMENT_ROOT'];
$upload_base = "/uploads/";
$target_path = $root_dir . $upload_base;

if (!file_exists($target_path)) {
    mkdir($target_path, 0755, true);
}

$userId = $_POST['userId'] ?? 'anonymous';
$type = $_POST['type'] ?? 'misc'; 
$user_upload_dir = $target_path . $userId . "/" . $type . "/";

if (!file_exists($user_upload_dir)) {
    mkdir($user_upload_dir, 0755, true);
}

if (isset($_FILES["file"])) {
    $original_name = basename($_FILES["file"]["name"]);
    $clean_name = preg_replace("/[^a-zA-Z0-9\._-]/", "_", $original_name);
    $filename = time() . "_" . $clean_name;
    $target_file = $user_upload_dir . $filename;
    
    if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'];
        $public_url = $protocol . "://" . $host . $upload_base . $userId . "/" . $type . "/" . $filename;
        
        echo json_encode([
            "status" => "success",
            "fileUrl" => $public_url,
            "filename" => $clean_name
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Upload failed."]);
    }
}
?>