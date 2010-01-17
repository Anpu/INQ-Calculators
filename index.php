<?php
// Pull in the configuration file.. (Yes this actually works)
$config = include "config.php";

// Set debugging if enabled
define('DEBUG',!empty($config->debug));

// Load up the class auto loader
require_once "classes/Init.php";

Template::addTemplatePath(__DIR__.'/templates');
Database::setDSN($config->db->dsn, $config->db->user, $config->db->password);

try {
    $tpl = new Template("index.xhtml");
    $tpl->echoExecute();
} catch (Exception $ex) {
    die ((string)$ex);
}
?>
