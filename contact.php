<?php
declare(strict_types=1);

session_start();

const CONTACT_TO = 'jayproductions@jayproductions.nl';
const CONTACT_FROM = 'no-reply@jayproductions.nl';
const CONTACT_REDIRECT = 'index.html#contact';

function wants_json(): bool
{
	$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
	$requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';

	return stripos($accept, 'application/json') !== false || strtolower($requestedWith) === 'fetch';
}

function respond_contact(string $status, string $message): void
{
	if (wants_json()) {
		http_response_code($status === 'sent' ? 200 : 422);
		header('Content-Type: application/json; charset=UTF-8');
		echo json_encode([
			'status' => $status,
			'message' => $message,
		], JSON_UNESCAPED_UNICODE);
		exit;
	}

	redirect_contact($status);
}

function redirect_contact(string $status): void
{
	header('Location: index.html?contact=' . rawurlencode($status) . '#contact', true, 303);
	exit;
}

function field(string $name): string
{
	return isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
}

function clean_text(string $value, int $maxLength): string
{
	$value = strip_tags($value);
	$value = preg_replace('/[^\P{C}\r\n\t]+/u', '', $value) ?? '';
	$value = preg_replace("/\r\n|\r/", "\n", $value) ?? '';
	$value = preg_replace("/[ \t]+/", ' ', $value) ?? '';
	$value = trim($value);

	return substr($value, 0, $maxLength);
}

function has_header_injection(string $value): bool
{
	return preg_match("/[\r\n]/", $value) === 1;
}

function spam_score(string $name, string $email, string $message): int
{
	$score = 0;
	$combined = strtolower($name . ' ' . $email . ' ' . $message);

	$linkMatches = preg_match_all('/https?:\/\/|www\.|href=|\[url/iu', $combined);
	if ($linkMatches !== false && $linkMatches > 1) {
		$score += 2;
	}

	$spamTerms = [
		'backlink',
		'casino',
		'crypto',
		'guest post',
		'loan',
		'seo package',
		'telegram',
		'viagra',
		'whatsapp',
	];

	foreach ($spamTerms as $term) {
		if (strpos($combined, $term) !== false) {
			$score += 2;
		}
	}

	if (preg_match('/(.)\1{8,}/u', $message) === 1) {
		$score += 2;
	}

	if (strlen($message) < 20) {
		$score += 1;
	}

	return $score;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	header('Location: ' . CONTACT_REDIRECT, true, 303);
	exit;
}

$name = clean_text(field('name'), 80);
$email = clean_text(field('email'), 120);
$project = clean_text(field('project'), 80);
$message = clean_text(field('message'), 3000);
$website = field('website');
$company = field('company');
$startedAt = (int) field('started_at');
$now = time();

$allowedProjects = [
	'Brandfilm',
	'Aftermovie',
	'Interview',
	'Muziekvideo',
	'Bedrijfsvideo',
	'Fotografie',
	'Anders',
];

if ($website !== '' || $company !== '') {
	respond_contact('error', 'Je aanvraag kon niet worden verwerkt. Probeer het opnieuw.');
}

if ($startedAt <= 0 || ($now - $startedAt) < 4 || ($now - $startedAt) > 86400) {
	respond_contact('error', 'Je aanvraag kon niet worden verwerkt. Probeer het opnieuw.');
}

if (isset($_SESSION['last_contact_submit']) && ($now - (int) $_SESSION['last_contact_submit']) < 60) {
	respond_contact('error', 'Er is net al een aanvraag verzonden. Wacht kort en probeer het daarna opnieuw.');
}

if (
	$name === '' ||
	$email === '' ||
	$project === '' ||
	$message === '' ||
	strlen($name) < 2 ||
	!filter_var($email, FILTER_VALIDATE_EMAIL) ||
	!in_array($project, $allowedProjects, true) ||
	has_header_injection($name) ||
	has_header_injection($email) ||
	spam_score($name, $email, $message) >= 3
) {
	respond_contact('error', 'Controleer je gegevens en probeer het opnieuw.');
}

$submittedAt = date('d-m-Y H:i:s');
$remoteAddress = $_SERVER['REMOTE_ADDR'] ?? 'Onbekend';
$subjectText = 'Projectaanvraag: ' . $project . ' - ' . $name;
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';

$body = implode("\n", [
	'Nieuwe projectaanvraag',
	'JayProductions',
	'',
	'Er is een nieuwe aanvraag verstuurd via het contactformulier op jayproductions.nl.',
	'',
	'Aanvrager',
	'Naam: ' . $name,
	'E-mail: ' . $email,
	'Projecttype: ' . $project,
	'',
	'Bericht van de aanvrager',
	'',
	$message,
	'',
	'Administratie',
	'Verzonden: ' . $submittedAt,
	'IP-adres: ' . $remoteAddress,
	'',
]);

$headers = [
	'From: JayProductions <' . CONTACT_FROM . '>',
	'Reply-To: ' . $email,
	'MIME-Version: 1.0',
	'Content-Type: text/plain; charset=UTF-8',
	'Content-Transfer-Encoding: 8bit',
	'X-Mailer: JayProductions Contact Form',
];

$_SESSION['last_contact_submit'] = $now;

$sent = mail(CONTACT_TO, $subject, $body, implode("\r\n", $headers), '-f' . CONTACT_FROM);

respond_contact(
	$sent ? 'sent' : 'error',
	$sent
		? 'Bedankt, je aanvraag is verzonden. We nemen zo snel mogelijk contact op.'
		: 'Verzenden is niet gelukt. Probeer het later opnieuw of mail direct naar jayproductions@jayproductions.nl.'
);
