<?php

$apiKey = getenv('CHEFU_API_KEY');
if (!$apiKey) {
    fwrite(STDERR, "Set CHEFU_API_KEY before running this example.\n");
    exit(1);
}

$baseUrl = rtrim(getenv('CHEFU_API_BASE_URL') ?: 'https://api.chefuinc.com/api', '/');
$url = $baseUrl . '/courses?limit=5';

$curl = curl_init($url);
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Accept: application/json',
    ],
]);

$body = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$error = curl_error($curl);
curl_close($curl);

if ($body === false) {
    fwrite(STDERR, "Network error: " . $error . "\n");
    exit(1);
}

if ($status < 200 || $status >= 300) {
    fwrite(STDERR, "CheFu API error " . $status . ": " . $body . "\n");
    exit(1);
}

$data = json_decode($body, true);
foreach (($data['courses'] ?? []) as $course) {
    $title = $course['courseTitle'] ?? $course['title'] ?? $course['id'] ?? 'Untitled course';
    echo '- ' . $title . PHP_EOL;
}
