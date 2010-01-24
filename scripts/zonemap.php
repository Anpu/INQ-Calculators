#!/usr/bin/php
<?php
if (!defined('__DIR__')) {
    define('__DIR__',dirname(__FILE__));
}
// Pull in the configuration file.. (Yes this actually works)
$config = include __DIR__."/config.php";

// Set debugging if enabled
define('DEBUG',!empty($config->debug));

// Load up the class auto loader
require_once __DIR__."/../classes/Init.php";

$parser = new Console_CommandLine();
$parser->description = "Convert zone point data into a convex hull.";
$parser->version = "0.0.1";
$parser->addOption('zoneid',array(
    'short_name'    => '-z',
    'long_name'     => '--zone',
    'description'   => 'the Zone to convert',
    'help_name'     => 'ZONE',
    'action'        => 'StoreInt',
));
try {
    $args = $parser->parse();
} catch (Exception $ex) {
    $parser->displayError($ex->getMessage());
}

$zonestable = $config->tables->zones;
$pointstable = $config->tables->points;

Database::setDSN($config->db->dsn, $config->db->user, $config->db->password);

$dbh = Database::get();
$fetchzone = $dbh->prepare("SELECT x,z FROM $pointstable WHERE zone_id = ?");

$zonebounds = $dbh->prepare("SELECT MIN(x) t, MIN(z) l, MAX(x) n, MAX(z) r FROM $pointstable WHERE zone_id = ?");
$zonepoints = $dbh->prepare("SELECT x,MIN(z) minz,MAX(z) maxz FROM $pointstable WHERE zone_id = ? GROUP BY x");

$stmt = $dbh->query("SELECT MIN(x) t, MIN(z) l, MAX(x) b, MAX(z) r FROM $pointstable");
$bounds = $stmt->fetchObject();
$stmt->closeCursor();

$normx = $bounds->t - 5;
$normz = $bounds->l - 5;

$img = imagecreate($bounds->r - $bounds->l + 10, $bounds->b - $bounds->t + 10);

$white = imagecolorallocate($img, 255, 255, 255);
$colors = array(
    'Alsius'=>imagecolorallocate($img, 10, 10, 220),
    'Syrtis'=>imagecolorallocate($img, 10, 220, 10),
    'Ignis'=>imagecolorallocate($img, 220, 10, 10),
    ''=>imagecolorallocate($img, 0, 0, 0),
);

if (empty($args->options['zoneid'])) {
    $zones = $dbh->query("SELECT * FROM $zonestable");

    foreach ($zones as $_zone) {
        drawZone($img, $_zone);
    }
    $zones->closeCursor();
} else {
    $zoneinfo = $dbh->prepare("SELECT * FROM $zonestable WHERE zone_id = ?");
    $zoneinfo->execute(array($args->options['zoneid']));
    $_zone = $zoneinfo->fetch();
    $zoneinfo->closeCursor();
    drawZone($img, $_zone);
}

echo "Write Map\n";
imagepng($img, 'Zone'.'.png');
imagedestroy($img);

function drawZone($img, $_zone) {
    global $colors, $normx, $normz, $zonepoints;
    echo "Process Zone ".$_zone['zone_id']." (".$_zone['name'].")\n";

    $zonepoints->execute(array($_zone['zone_id']));
    $points = array();
    foreach ($zonepoints as $row) {
        array_push($points,(object)array('x'=>$row['x'],'z'=>$row['maxz']));
        array_unshift($points,(object)array('x'=>$row['x'],'z'=>$row['minz']));
    }
    $zonepoints->closeCursor();

    $r = is_null($_zone['realm']) ? '' : $_zone['realm'];
    $color = $colors[$r];
    for ($i=0, $l=count($points), $j=$l-1; $i<$l; $j=$i,++$i) {
        $v1 = $points[$j];
        $v2 = $points[$i];
        imageline($img,
                $v1->z - $normz,
                $v1->x - $normx,
                $v2->z - $normz,
                $v2->x - $normx,
                $color);
    }
}
?>
