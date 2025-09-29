 <?php
    header('Content-Type: application/json');

    $jsonFile = 'tasks.json';

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['title']) || empty(trim($input['title']))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'El título de la tarea es obligatorio.']);
        exit;
    }

    if (!file_exists($jsonFile) || !is_readable($jsonFile)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: No se puede leer el archivo de tareas.']);
        exit;
    }

    $tasks = json_decode(file_get_contents($jsonFile), true);

    // Generar un nuevo ID único
    $maxId = 0;
    foreach ($tasks as $task) {
        if (isset($task['id']) && $task['id'] > $maxId) {
            $maxId = $task['id'];
        }
    }
    $newId = $maxId + 1;

    // Preparar el array de asignados
    $assigned = [];
    if (isset($input['developer']) && !empty(trim($input['developer']))) {
        $assigned[] = trim(strtoupper($input['developer']));
    }

    // Crear el nuevo objeto de tarea
    $newTask = [
        'id' => $newId,
        'title' => trim($input['title']),
        'status' => 'planned', // Estado por defecto
        'assigned_to' => $assigned,
        'subtasks' => [],
        'notes' => ''
    ];

    // Añadir la nueva tarea al array
    $tasks[] = $newTask;

    // Guardar el array actualizado en el archivo JSON
    if (file_put_contents($jsonFile, json_encode($tasks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        // Devolver la tarea recién creada para que el frontend la pueda añadir dinámicamente
        echo json_encode(['success' => true, 'message' => 'Tarea creada correctamente.', 'task' => $newTask]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: No se pudo escribir en el archivo de tareas.']);
    }
    ?>