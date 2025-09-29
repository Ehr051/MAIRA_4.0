 <?php
    header('Content-Type: application/json');

    $jsonFile = 'tasks.json';

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['taskId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Falta el ID de la tarea.']);
        exit;
    }

    $taskIdToDelete = $input['taskId'];

    if (!file_exists($jsonFile) || !is_readable($jsonFile)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: No se puede leer el archivo de tareas.']);
        exit;
    }

    $tasks = json_decode(file_get_contents($jsonFile), true);

    // Filtrar el array para excluir la tarea a eliminar
    $originalCount = count($tasks);
    $tasks = array_filter($tasks, function ($task) use ($taskIdToDelete) {
        // Usamos '!=' para comparación flexible, ya que el ID del JSON puede ser número y el del data attribute string.
        return isset($task['id']) && $task['id'] != $taskIdToDelete;
    });

    // Re-indexar el array para asegurar que siga siendo una lista JSON []
    $tasks = array_values($tasks);

    if (count($tasks) < $originalCount) {
        if (file_put_contents($jsonFile, json_encode($tasks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
            echo json_encode(['success' => true, 'message' => 'Tarea eliminada correctamente.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error: No se pudo escribir en el archivo de tareas.']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Error: Tarea no encontrada.']);
    }
    ?>