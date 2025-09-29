<?php
header('Content-Type: application/json');

$jsonFile = 'tasks.json';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['taskId']) || !isset($input['developer'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan datos: se requiere taskId y developer.']);
    exit;
}

$taskIdToUpdate = $input['taskId'];
$developer = strtoupper(trim($input['developer']));

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
        $taskFound = true;
        $assigned_to = isset($task['assigned_to']) ? $task['assigned_to'] : [];

        // Si el desarrollador es 'NONE', se desasignan todos.
        if ($developer === 'NONE') {
            $assigned_to = [];
        } else {
            // Si el desarrollador ya está asignado, se quita. Si no, se añade.
            $index = array_search($developer, $assigned_to);
            if ($index !== false) {
                array_splice($assigned_to, $index, 1);
            } else {
                $assigned_to[] = $developer;
            }
        }

        $task['assigned_to'] = array_values(array_unique($assigned_to)); // Asegura que no haya duplicados y reindexa
        $updatedTask = $task;
        break;
    }
}

if ($taskFound) {
    if (file_put_contents($jsonFile, json_encode($tasks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(['success' => true, 'message' => 'Asignación actualizada.', 'task' => $updatedTask]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: No se pudo escribir en el archivo de tareas.']);
    }
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Error: Tarea no encontrada.']);
}
