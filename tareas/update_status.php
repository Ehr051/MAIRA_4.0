<?php
header('Content-Type: application/json');

$jsonFile = 'tasks.json';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['taskId']) || !isset($input['newStatus'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan datos: se requiere taskId y newStatus.']);
    exit;
}

$taskIdToUpdate = $input['taskId'];
$newStatus = $input['newStatus'];

if (!file_exists($jsonFile) || !is_readable($jsonFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: No se puede leer el archivo de tareas.']);
    exit;
}

$tasks = json_decode(file_get_contents($jsonFile), true);

$taskFound = false;
foreach ($tasks as &$task) {
    if (isset($task['id']) && $task['id'] == $taskIdToUpdate) {
        $task['status'] = $newStatus;
        $taskFound = true;
        break;
    }
}

if ($taskFound) {
    if (file_put_contents($jsonFile, json_encode($tasks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(['success' => true, 'message' => 'Estado de la tarea actualizado correctamente.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: No se pudo escribir en el archivo de tareas.']);
    }
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Error: Tarea no encontrada.']);
}
