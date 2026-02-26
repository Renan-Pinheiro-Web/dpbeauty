<?php
// ============================================================
//  DP Beauty Gestão — API PHP
//  Configurado para: dpbeauty_leads / dpbeauty_user
// ============================================================

define('DB_HOST',    'localhost');
define('DB_USER',    'u706265633_dpbeauty_user');
define('DB_PASS',    'Dp2025Secure');
define('DB_NAME',    'u706265633_dpbeauty_leads');
define('JWT_SECRET', 'dpbeauty_jwt_2025_rennnanmaia_ultra_secret_key_xK9mP2qL');

// --- CORS ---------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- CONEXÃO MYSQL ------------------------------------------
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            jsonResponse(500, ['error' => 'Erro de conexão: ' . $e->getMessage()]);
        }
    }
    return $pdo;
}

// --- UTILITÁRIOS --------------------------------------------
function jsonResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function getBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// --- JWT ----------------------------------------------------
function jwtCreate($payload) {
    $header  = b64u(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = time() + (8 * 3600);
    $payload = b64u(json_encode($payload));
    $sig     = b64u(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

function jwtVerify($token) {
    $p = explode('.', $token);
    if (count($p) !== 3) return null;
    [$h, $payload, $sig] = $p;
    if (!hash_equals(b64u(hash_hmac('sha256', "$h.$payload", JWT_SECRET, true)), $sig)) return null;
    $data = json_decode(b64d($payload), true);
    if (!$data || $data['exp'] < time()) return null;
    return $data;
}

function b64u($d) { return rtrim(strtr(base64_encode($d), '+/', '-_'), '='); }
function b64d($d) { return base64_decode(strtr($d, '-_', '+/') . str_repeat('=', (4 - strlen($d) % 4) % 4)); }

function requireAuth() {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/i', $h, $m)) jsonResponse(401, ['error' => 'Token não fornecido']);
    $p = jwtVerify($m[1]);
    if (!$p) jsonResponse(403, ['error' => 'Token inválido ou expirado']);
    return $p;
}

// --- ROTEADOR -----------------------------------------------
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = preg_replace('#^.*?/api\.php#', '', $uri);
$parts  = array_values(array_filter(explode('/', $uri)));
$route  = $parts[0] ?? '';
$sub    = $parts[1] ?? null;

// ============================================================
//  AUTENTICAÇÃO
// ============================================================
if ($route === 'auth' && $sub === 'login' && $method === 'POST') {
    $b = getBody();
    $email = trim($b['email'] ?? '');
    $pass  = trim($b['password'] ?? '');
    if (!$email || !$pass) jsonResponse(400, ['error' => 'E-mail e senha obrigatórios']);

    $stmt = getDB()->prepare('SELECT * FROM admin_users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password'])) {
        jsonResponse(401, ['error' => 'Credenciais inválidas']);
    }

    jsonResponse(200, ['token' => jwtCreate(['id' => $user['id'], 'email' => $user['email']]), 'email' => $user['email']]);
}

if ($route === 'auth' && $sub === 'me' && $method === 'GET') {
    $p = requireAuth();
    jsonResponse(200, ['email' => $p['email']]);
}

// ============================================================
//  LEADS
// ============================================================
if ($route === 'leads' && !$sub && $method === 'GET') {
    requireAuth();
    jsonResponse(200, getDB()->query('SELECT * FROM leads ORDER BY created_at DESC')->fetchAll());
}

if ($route === 'leads' && !$sub && $method === 'POST') {
    $b = getBody();
    $nome   = trim($b['nome']     ?? '');
    $email  = trim($b['email']    ?? '');
    $tel    = trim($b['telefone'] ?? '');
    $cidade = trim($b['cidade']   ?? '');
    if (!$nome || !$email || !$tel || !$cidade) jsonResponse(400, ['error' => 'Todos os campos são obrigatórios']);

    $stmt = getDB()->prepare('INSERT INTO leads (nome, email, telefone, cidade) VALUES (?, ?, ?, ?)');
    $stmt->execute([$nome, $email, $tel, $cidade]);
    jsonResponse(201, ['success' => true]);
}

if ($route === 'leads' && $sub && $method === 'PUT') {
    requireAuth();
    $b = getBody();
    getDB()->prepare('UPDATE leads SET nome=?, email=?, telefone=?, cidade=? WHERE id=?')
           ->execute([trim($b['nome']??''), trim($b['email']??''), trim($b['telefone']??''), trim($b['cidade']??''), $sub]);
    jsonResponse(200, ['success' => true]);
}

if ($route === 'leads' && $sub && $method === 'DELETE') {
    requireAuth();
    getDB()->prepare('DELETE FROM leads WHERE id=?')->execute([$sub]);
    jsonResponse(200, ['success' => true]);
}

if ($route === 'health' && $method === 'GET') {
    jsonResponse(200, ['status' => 'ok', 'banco' => DB_NAME, 'hora' => date('d/m/Y H:i:s')]);
}

jsonResponse(404, ['error' => 'Rota não encontrada']);