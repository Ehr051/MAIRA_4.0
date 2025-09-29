<?php
header('Content-Type: application/json');

$jsonFile = 'tasks.json';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['taskId']) || !isset($input['notes'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan datos: se requiere taskId y notes.']);
    exit;
}

$taskIdToUpdate = $input['taskId'];
$newNotes = $input['notes'];

if (!file_exists($jsonFile) || !is_readable($jsonFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: No se puede leer el archivo de tareas.']);
    exit;
}

$tasks = json_decode(file_get_contents($jsonFile), true);

$taskFound = false;
$updatedTask = null;

foreach ($tasks as &$task) {
    if (isset($task['id']) && $task['id'] == $taskIdToUpdate) {
        $task['notes'] = $newNotes;
        $taskFound = true;
        $updatedTask = $task;
        break;
    }
}

if ($taskFound) {
    if (file_put_contents($jsonFile, json_encode($tasks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(['success' => true, 'message' => 'Notas de la tarea actualizadas.', 'task' => $updatedTask]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: No se pudo escribir en el archivo de tareas.']);
    }
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Error: Tarea no encontrada.']);
}
