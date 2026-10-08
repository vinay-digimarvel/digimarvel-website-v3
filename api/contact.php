<?php
/*
 * Talk to us form handler. Validates the enquiry and delivers it to the
 * DigiMarvel inbox through Resend (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Secrets live outside the web root in digimarvel-config.php (see
 * digimarvel-config.example.php in the repo root). For local testing, the
 * RESEND_API_KEY and CONTACT_ALLOWED_ORIGINS (comma-separated) environment
 * variables override it.
 *
 * fetch() callers send Accept: application/json and get JSON back. Browsers
 * without JavaScript post the form normally and are redirected to
 * contact.html#sent or contact.html#send-failed.
 */

declare(strict_types=1);

const TOPICS = [
    'Workflow modernization (Odoo)',
    'Agent-enabled workflows',
    'Business foundations',
    'A software project',
    'A knowledge AI idea',
    'Not sure yet',
];
const LIMITS = ['name' => 100, 'organization' => 150, 'email' => 254, 'subject' => 120, 'message' => 5000];
const RATE_LIMIT = 5;          // submissions per IP...
const RATE_WINDOW = 3600;      // ...per hour

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function finish(int $status, array $body, bool $wantsJson): never
{
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($body);
    } else {
        header('Location: ../contact.html#' . ($body['ok'] ? 'sent' : 'send-failed'), true, 303);
    }
    exit;
}

function config(): array
{
    $file = dirname(__DIR__, 2) . '/digimarvel-config.php';
    $config = is_file($file) ? require $file : [];
    if ($key = getenv('RESEND_API_KEY')) $config['resend_api_key'] = $key;
    if ($origins = getenv('CONTACT_ALLOWED_ORIGINS')) $config['allowed_origins'] = explode(',', $origins);
    return $config + [
        'resend_api_key' => '',
        'from' => 'DigiMarvel website <website@notify.digimarvel.ai>',
        'to' => 'support@digimarvel.ai',
        'allowed_origins' => ['https://www.digimarvel.ai', 'https://digimarvel.ai'],
    ];
}

function clean(string $value, bool $multiline = false): string
{
    $value = trim($value);
    // Single-line fields end up in the subject line, so drop control characters including newlines.
    $pattern = $multiline ? '/[^\P{C}\n\t]/u' : '/\p{C}/u';
    return (string) preg_replace($pattern, '', str_replace("\r\n", "\n", $value));
}

function rateLimited(string $ip): bool
{
    $dir = sys_get_temp_dir() . '/digimarvel-contact';
    if (!is_dir($dir) && !@mkdir($dir, 0700) && !is_dir($dir)) return false;
    $fp = @fopen($dir . '/' . hash('sha256', $ip), 'c+');
    if (!$fp) return false;
    flock($fp, LOCK_EX);
    $now = time();
    $hits = array_filter(
        array_map('intval', explode(',', stream_get_contents($fp) ?: '')),
        fn($t) => $t > $now - RATE_WINDOW
    );
    $limited = count($hits) >= RATE_LIMIT;
    if (!$limited) $hits[] = $now;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, implode(',', $hits));
    flock($fp, LOCK_UN);
    fclose($fp);
    return $limited;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    finish(405, ['ok' => false, 'error' => 'Method not allowed.'], true);
}

$config = config();

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, $config['allowed_origins'], true)) {
    finish(403, ['ok' => false, 'error' => 'This form only accepts messages from digimarvel.ai.'], $wantsJson);
}

// Honeypot: people never see this field, bots fill it in. Pretend it worked.
if (($_POST['website'] ?? '') !== '') {
    finish(200, ['ok' => true], $wantsJson);
}

$data = [
    'name' => clean((string) ($_POST['name'] ?? '')),
    'organization' => clean((string) ($_POST['organization'] ?? '')),
    'email' => clean((string) ($_POST['email'] ?? '')),
    'topic' => clean((string) ($_POST['topic'] ?? '')),
    'subject' => clean((string) ($_POST['subject'] ?? '')),
    'message' => clean((string) ($_POST['message'] ?? ''), true),
];

$errors = [];
foreach ($data as $field => $value) {
    if ($value === '') $errors[$field] = 'Required.';
    elseif (isset(LIMITS[$field]) && mb_strlen($value) > LIMITS[$field]) $errors[$field] = 'Too long.';
}
if (!isset($errors['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Enter a valid email address.';
if (!isset($errors['topic']) && !in_array($data['topic'], TOPICS, true)) $errors['topic'] = 'Choose an option.';
if ($errors) {
    finish(422, ['ok' => false, 'error' => 'Please check the highlighted fields.', 'fields' => $errors], $wantsJson);
}

if (rateLimited($_SERVER['REMOTE_ADDR'] ?? 'unknown')) {
    finish(429, ['ok' => false, 'error' => 'Too many messages from this connection. Please try again later.'], $wantsJson);
}

if ($config['resend_api_key'] === '') {
    error_log('contact.php: Resend API key is not configured');
    finish(503, ['ok' => false, 'error' => 'The form is not available right now.'], $wantsJson);
}

$details = [
    'Name' => $data['name'],
    'Organization' => $data['organization'],
    'Email' => $data['email'],
    'Interested in' => $data['topic'],
];
$text = $data['message'] . "\n\n—\n";
$rows = '';
foreach ($details as $label => $value) {
    $text .= "$label: $value\n";
    $rows .= '<tr><td style="padding:4px 16px 4px 0;color:#666">' . $label . '</td><td style="padding:4px 0">'
        . htmlspecialchars($value, ENT_QUOTES, 'UTF-8') . '</td></tr>';
}
$html = '<div style="font:15px/1.6 -apple-system,Segoe UI,sans-serif;color:#111">'
    . '<p style="white-space:pre-wrap;margin:0 0 24px">' . htmlspecialchars($data['message'], ENT_QUOTES, 'UTF-8') . '</p>'
    . '<table style="border-top:1px solid #ddd;padding-top:12px;font-size:14px">' . $rows . '</table>'
    . '<p style="margin-top:24px;font-size:12px;color:#888">Sent from the Talk to us form on digimarvel.ai. Reply to answer the sender directly.</p></div>';

$payload = [
    'from' => $config['from'],
    'to' => [$config['to']],
    'reply_to' => $data['email'],
    'subject' => mb_substr("Website enquiry: {$data['subject']} · {$data['topic']}", 0, 200),
    'text' => $text,
    'html' => $html,
];

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $config['resend_api_key'],
        'Content-Type: application/json',
        'User-Agent: digimarvel-website/1.0',
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
]);
$response = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($status < 200 || $status >= 300) {
    error_log('contact.php: Resend request failed (' . $status . ') ' . ($curlError ?: substr((string) $response, 0, 500)));
    finish(502, ['ok' => false, 'error' => 'We could not send your message.'], $wantsJson);
}

finish(200, ['ok' => true], $wantsJson);
