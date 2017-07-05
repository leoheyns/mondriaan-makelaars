<?php
if ($_SERVER['PHP_AUTH_USER'] != 'makelaar' || $_SERVER['PHP_AUTH_PW'] != 'Mondriaan') {
    header('WWW-Authenticate: Basic realm="Makelaar site"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'Je moet inloggen';
    exit;
}
?>
