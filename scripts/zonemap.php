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
$cmd = $parser->addCommand('basic',array(
    'description'=>'Perform a basic calculation of the bounding polygon plot the points',
));
$cmd->addOption('outputfile',array(
    'short_name'    => '-o',
    'description'   => 'Output filename',
    'default'       => 'Zone.png',
    'optional'      => true,
    'help_name'     => 'FILE',
));
$cmd->addArgument('zoneids',array(
    'multiple'      => true,
    'description'   => 'the Zones to convert',
    'optional'      => true,
    'help_name'     => 'zones',
));

$cmd = $parser->addCommand('flood',array(
    'description'=>'Map out the the zones so that a tracing algorithm can be used (half size)',
));
$cmd->addOption('outputfile',array(
    'short_name'    => '-o',
    'description'   => 'Output filename',
    'default'       => 'Zone.png',
    'optional'      => true,
    'help_name'     => 'FILE',
));
$cmd->addArgument('zoneids',array(
    'multiple'      => true,
    'description'   => 'the Zones to convert',
    'optional'      => true,
    'help_name'     => 'zones',
));

$cmd = $parser->addCommand('xyz',array(
    'description'=>'Output xyz text file for GMT',
));
$cmd->addOption('outputfile',array(
    'short_name'    => '-o',
    'description'   => 'Output filename',
    'default'       => 'Zone.txt',
    'optional'      => true,
    'help_name'     => 'FILE',
));
$cmd->addArgument('zoneids',array(
    'multiple'      => true,
    'description'   => 'the Zones to convert',
    'optional'      => true,
    'help_name'     => 'zones',
));

$cmd = $parser->addCommand('trace',array(
    'description'=>'Trace to SVG file using potrace',
));
$cmd->addOption('outputfile',array(
    'short_name'    => '-o',
    'description'   => 'Output filename',
    'default'       => 'Zone.png',
    'optional'      => true,
    'help_name'     => 'FILE',
));
$cmd->addArgument('zoneids',array(
    'multiple'      => true,
    'description'   => 'the Zones to convert',
    'optional'      => true,
    'help_name'     => 'zones',
));

try {
    $args = $parser->parse();
} catch (Exception $ex) {
    $parser->displayError($ex->getMessage());
}

$zonestable = $config->tables->zones;
$pointstable = $config->tables->points;
$polytable = $config->tables->polygons;

Database::setDSN($config->db->dsn, $config->db->user, $config->db->password);

$dbh = Database::get();

$fetchzone = $dbh->prepare("SELECT x,z FROM $pointstable WHERE zone_id = ?");

$zonebounds = $dbh->prepare("SELECT MIN(x) t, MIN(z) l, MAX(x) b, MAX(z) r FROM $pointstable WHERE zone_id = ?");
$zonepointrange = $dbh->prepare("SELECT x y,MIN(z) minx,MAX(z) maxx FROM $pointstable WHERE zone_id = ? GROUP BY x");
$zonepoly = $dbh->prepare("INSERT IGNORE INTO $polytable (zone_id,polygon) VALUES (?, PolyFromText(?))");
$zoneinfo = $dbh->prepare("SELECT * FROM $zonestable WHERE zone_id = ?");
$zonepoints = $dbh->prepare("SELECT x y,z x FROM $pointstable WHERE zone_id = ? ORDER BY z, x");

if (empty($args->command->args['zoneids'])) {
    $bounds = (object)array('l'=>0,'t'=>0,'b'=>6110,'r'=>6130);
} else {
    $stmt = $dbh->query("SELECT MIN(x) t, MIN(z) l, MAX(x) b, MAX(z) r FROM $pointstable"
            .(empty($args->command->args['zoneids'])?"":" WHERE zone_id IN (".implode(',',$args->command->args['zoneids']).")"));
    $bounds = $stmt->fetchObject();
    $stmt->closeCursor();
}

if (empty($args->command->args['zoneids'])) {
    $stmt = $dbh->query("SELECT zone_id FROM $zonestable WHERE zone_id NOT IN (820,821,823,783)");
    $zones = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $stmt->closeCursor();
} else {
    $zones = $args->command->args['zoneids'];
}

switch ($args->command_name) {
    case 'flood':
        $normx = $bounds->l/2 - 5;
        $normy = $bounds->t/2 - 5;

        $img = imagecreate($bounds->r/2-$bounds->l/2+10, $bounds->b/2-$bounds->t/2+10);

        $white = imagecolorallocatealpha($img, 255, 255, 255,127.0);

        echo "Rendering ".count($zones)." zones\n";
        foreach ($zones as $_zid) {
            $zoneinfo->execute(array($_zid));
            $_zone = $zoneinfo->fetchObject();
            $zoneinfo->closeCursor();

            $polys = fetchPolygons($_zid);

            echo sprintf("Drawing %3d (%d polys) %s\n",
                        $_zid,
                        count($polys),
                        $_zone->name
                    );
            #drawZonePoints($img, $_zone, $color,$normx,$normy,true);
            foreach ($polys as $_poly) {
                if (count($_poly)<4) {
                    echo sprintf("Throwing away %d  (%d,%d)\n",count($_poly),$_poly[0]->x,$_poly[0]->y);
                } else {
                    #echo "Drawing poly ".count($_poly)."\n";
                    $color = allocateColor($img);
                    
                    drawPoints($img, $_poly, $color, $normx, $normy);
                    imagepng($img, $args->command->options['outputfile']);
                }
            }
            #drawPoly($img, $polys, $color);
            #drawZone($img, $polys, $color);
        }


        //echo "Write Map\n";
        //imagepng($img, 'Zone'.'.png');
        imagedestroy($img);
        break;
    case 'trace':
        echo "Rendering ".count($zones)." zones\n";
        $normx = $bounds->l;
        $normy = $bounds->t;

        $width = $bounds->r-$bounds->l;
        $height = $bounds->b-$bounds->t;
        echo "$width $height\n";
        $img = imagecreate($width, $height);
        $white = imagecolorallocate($img, 255, 255, 255);

        foreach ($zones as $_zid) {
            $file = tempnam('./','trace');
            echo "Write PBM\n";
            writePBM($_zid, $file);
            echo "Process PBM\n";
            exec("potrace -n -s -o $file.svg $file");
            echo "Parse SVG\n";
            $polys = parsePolygonsFromSVG($file.'.svg', $width, $height);

            foreach ($polys as $_poly) {
                var_dump($_poly);
                $color = allocateColor($img);
                drawPoly($img, $_poly, $color);
            }

            unlink($file);
            unlink($file.'.svg');
        }
        echo "Write PNG file\n";
        imagepng($img, $args->command->options['outputfile']);
        imagedestroy($img);
        break;
    case 'xyz':
        $fp = fopen($args->command->options['outputfile'],"w");
        echo sprintf("Bounds (%d,%d)-(%d,%d)\n",$bounds->l,$bounds->t,$bounds->r,$bounds->b);
        echo "Writing ".$args->command->options['outputfile']."\n";
        foreach ($zones as $_zid) {
            $zonepoints->execute(array($_zid));
            $zonepoints->setFetchMode(PDO::FETCH_OBJ);
            foreach ($zonepoints as $_point) {
                fputcsv($fp, array($_point->x,$_point->y,$_zid), "\t");
            }
            $zonepoints->closeCursor();
        }
        fclose($fp);
        break;
    case 'basic':
        $normx = $bounds->l - 5;
        $normy = $bounds->t - 5;
        $img = imagecreate($bounds->r - $bounds->l + 10, $bounds->b - $bounds->t + 10);

        $white = imagecolorallocate($img, 255, 255, 255);
        $colors = array(
            'Alsius'=>imagecolorallocate($img, 10, 10, 220),
            'Syrtis'=>imagecolorallocate($img, 10, 220, 10),
            'Ignis'=>imagecolorallocate($img, 220, 10, 10),
            ''=>imagecolorallocate($img, 0, 0, 0),
        );

        if (empty($args->args['zoneids'])) {
            $zones = $dbh->query("SELECT * FROM $zonestable WHERE zone_id NOT IN (820,821,823,783)");
            $zones->setFetchMode(PDO::FetchObject);
            foreach ($zones as $_zid) {
                $points = fastFindPoly($_zid);
                #insertPolygon($_zone, $points);

                $r = is_null($_zid->realm) ? '' : $_zid->realm;
                drawZonePoints($img, $_zid->zone_id, $colors['']);
                drawZone($img, $points, $colors[$r]);
            }
            $zones->closeCursor();
        } else {
            foreach ($args->args['zoneids'] as $_zid) {
                $zoneinfo->execute(array($_zid));
                $_zid = $zoneinfo->fetch();
                $zoneinfo->closeCursor();

                $points = fastFindPoly($_zid);
                #insertPolygon($_zone, $points);

                $r = is_null($_zid['realm']) ? '' : $_zid['realm'];
                drawZonePoints($img, $_zid, $colors['']);
                drawZone($img, $points, $colors[$r]);
            }
        }

        echo "Write Map\n";
        imagepng($img, $args->command->options['outputfile']);
        imagedestroy($img);
        break;
    default:
        $parser->displayUsage();
}

exit(0);

function writePBM($zid, $file, $width = null, $height = null, $normx = null, $normy = null) {
    global $zonebounds,$zonepoints;
    if (is_null($width)) {
        $zonebounds->execute(array($zid));
        $bounds = $zonebounds->fetchObject();
        $zonebounds->closeCursor();

        $normx = $bounds->l/2;
        $normy = $bounds->t/2;

        $width = $bounds->r/2-$bounds->l/2;
        $height = $bounds->b/2-$bounds->t/2;
    }

    try {
        $zonepoints->execute(array($zid));
        $zonepoints->setFetchMode(PDO::FETCH_OBJ);
    } catch (Exception $ex) {
        echo (string)$ex;
        return;
    }
    $map = array();
    foreach ($zonepoints as $row) {
        $map[$row->x/2-$normx][$row->y/2-$normy] = 1;
    }
    $zonepoints->closeCursor();

    $fp = fopen($file,"w");
    fwrite($fp, "P1\n# Pixel Map for zone ".$zid."\n".$width." ".$height."\n");
    for($y=0;$y<$height;$y++) {
        $b = array();
        for($x=0;$x<$width;$x++) {
            $b[] = pointExists($map, $x, $y) ? '1' : '0';
        }
        fwrite($fp, implode(' ',$b)."\n");
    }
    fclose($fp);
}

function matrix_product(&$m1, &$m2) {
    $rows = count($m1);
    $cols = count($m2[0]);
    $len = count($m2);
    $ret = array();

    for ($r=0; $r<$rows; $r++) {
        for ($c=0; $c<$cols; $c++) {
            $d = 0;
            for ($l=0; $l<$len; $l++) {
                $d += $m1[$r][$l] * $m2[$l][$c];
            }
            $ret[$r][$c] = $d;
        }
    }
    return $ret;
}

function transformSVG(&$matrix,$point) {
    $m = array(
        array($point->x),
        array($point->y),
        array(1),
    );
    $r = matrix_product($matrix, $m);
    return (object)array('x'=>$r[0][0],'y'=>$r[1][0]);
}

function parsePolygonsFromSVG($file, $width = null, $height = null) {
    $xml = simplexml_load_file($file);
    $xml->registerXPathNamespace('svg','http://www.w3.org/2000/svg');
    preg_match('/(\d+) (\d+) (\d+) (\d+)/',$xml['viewBox'],$a);

    $width = $a[3];
    $height = $a[4];
    $paths = $xml->xpath('//svg:path/..');
    $polys = array();
    foreach ($paths as $geomtry) {
        $transform = $geomtry['transform'];
        $fill = $geomtry['fill'];
        preg_match('/scale\(([0-9\.\-]+),([0-9\.\-]+)\)/',$transform,$scale);
        preg_match('/translate\(([0-9\.\-]+),([0-9\.\-]+)\)/',$transform,$translate);
        $matrix = array(
            array($scale[1],0,$translate[1]),
            array(0,$scale[2],$translate[2]),
            array(0,0,1),
        );
        $path = (string)$geomtry->path['d'];
        $pos = 0;
        $len = strlen($path);
        $current = (object)array('x'=>0,'y'=>0);
        while ($pos < $len) {
            $type = $path[$pos];
            ++$pos;
            switch($type) {
            case 'M':
            case 'm':
                //Start Polygon
                $poly = array();
                consumeNumber($path, $pos, $_x);
                consumeNumber($path, $pos, $_y);
                if ($type == 'm') {
                    $current->x += $_x;
                    $current->y += $_y;
                } else {
                    $current->x = $_x;
                    $current->y = $_y;
                }
                $poly[0] = transformSVG($matrix,(object)array('x'=>$current->x, 'y'=>$current->y));
                break;
            case 'z':
                //end Polygon
                $poly[] = $poly[0];
                $polys[] = $poly;
                $poly = array();
                break;
            case 'L':
            case 'l':
                consumeNumber($path, $pos, $_x);
                consumeNumber($path, $pos, $_y);
                if ($type == 'l') {
                    $current->x += $_x;
                    $current->y += $_y;
                } else {
                    $current->x = $_x;
                    $current->y = $_y;
                }
                $poly[] = transformSVG($matrix,(object)array('x'=>$current->x, 'y'=>$current->y));
                break;
            case 'C':
            case 'c':
                // in pairs of 3
                while (consumeNumber($path, $pos, $d)) {
                    consumeNumber($path, $pos, $d);
                    consumeNumber($path, $pos, $d);
                    consumeNumber($path, $pos, $d);
                    consumeNumber($path, $pos, $_x);
                    consumeNumber($path, $pos, $_y);
                    if ($type == 'c') {
                        $current->x += $_x;
                        $current->y += $_y;
                    } else {
                        $current->x = $_x;
                        $current->y = $_y;
                    }
                    $poly[] = transformSVG($matrix,(object)array('x'=>$current->x, 'y'=>$current->y));
                }
                break;
            }
        }
    }
    return $polys;
}

function consumeWS(&$str, &$pos) {
    $opos = $pos;
    $char = $str[$pos];
    while($char == ' ' || $char == "\n") {
        ++$pos;
        $char = $str[$pos];
    }
    return $pos - $opos;
}

function consumeNumber(&$str, &$pos, &$num) {
    $out = '';
    $opos = $pos;
    $ws = consumeWS($str,$pos);
    $char = $str[$pos];
    while(($char >= '0' && $char <= '9') || $char == '-') {
        $out .= $char;
        ++$pos;
        $char = $str[$pos];
    }
    if ($ws == ($pos - $opos)) {
        return false;
    } else {
        $num = (int)$out;
        return $pos - $opos;
    }
}

function &fastFindPoly($_zone) {
    global $zonepointrange;
    echo "Process Zone ".$_zone['zone_id']." (".$_zone['name'].")\n";

    $zonepointrange->execute(array($_zone['zone_id']));
    $points = array();
    foreach ($zonepointrange as $row) {
        array_push($points,(object)array('y'=>$row['y'],'x'=>$row['maxx']));
        array_unshift($points,(object)array('y'=>$row['y'],'x'=>$row['minx']));
    }
    $zonepointrange->closeCursor();
    return $points;
}

function &fetchPolygons($_zone) {
    global $zonepoints;


    $zonepoints->execute(array($_zone));
    $zonepoints->setFetchMode(PDO::FETCH_ASSOC);
    // Initalize all the points
    $points = array();
    $map = array();
    foreach ($zonepoints as $row) {
        $point = (object)array(
            'x'=>$row['x']/2,
            'y'=>$row['y']/2,
            'seen'=>false,
            'edge'=>false,
        );
        $map[$row['x']/2][$row['y']/2] = $point;
        $points[] = $point;
    }
    $zonepoints->closeCursor();

    $edges = array();
    $edgemap = array();
    // Walk through all points finding edges
    foreach ($points as $point) {
        // check surrounding pixel
        if (pointExists($map, $point->x+1, $point->y)
                && pointExists($map, $point->x-1, $point->y)
                && pointExists($map, $point->x, $point->y+1)
                && pointExists($map, $point->x, $point->y-1) ) {
            continue;
        }
        $point->edge = true;
        $edges[] = $point;
        $edgemap[$point->x][$point->y] = $point;
    }

    // ok walk the edges and build the polygons
    $polys = array();
    while (($startedge = unseenEdge($edges))!==false) {
        #echo sprintf("finding poly staring @ %d,%d\n",$startedge->x,$startedge->y);
        $poly = array();
        $poly[] = $startedge;
        $curedge = $startedge;
        while (($curedge = nextEdge($edgemap, $curedge, $startedge))!==false) {
            $poly[] = $curedge;
        }
        $polys[] = $poly;
    }
    return $polys;
}

function unseenEdge(array &$edges) {
    foreach ($edges as $edge) {
        if (!$edge->seen) {
            $edge->seen = true;
            return $edge;
        }
    }
    return false;
}

/**
 *
 * @param array $edgemap
 * @param <type> $curedge
 * @param <type> $startedge
 * @return <type>
 *
 * @todo pass in current line angle and adjust possibilities based on that angle
 */
function nextEdge(array &$edgemap, $curedge, $startedge) {
    $x = $curedge->x;
    $y = $curedge->y;
    $points = array(
        array($x  ,$y+1), //top
        array($x+1,$y  ), //right
        array($x  ,$y-1), //bottom
        array($x-1,$y  ), //left
        array($x+1,$y+1), //top right
        array($x+1,$y-1), //bottom right
        array($x-1,$y-1), //bottom left
        array($x-1,$y+1), //top left
        // 2 away at angles
        array($x+1,$y+2), // knight up right
        array($x+2,$y+1), // knight right up
        array($x+2,$y-1), // knight right down
        array($x+1,$y-2), // knight down right
        array($x-1,$y-2), // knight down left
        array($x-2,$y-1), // knight left down
        array($x-2,$y+1), // knight left up
        array($x-1,$y+2), // knight up left
        // 2 away straight
        array($x  ,$y+2), //up
        array($x+2,$y  ), //right
        array($x  ,$y-2), //down
        array($x-2,$y  ), //left
    );
    $i=0;
    foreach ($points as $_p) {
        $i++;
        if (pointExists($edgemap, $_p[0], $_p[1])) {
            $edge = $edgemap[$_p[0]][$_p[1]];
            if (!$edge->seen) {
                $edge->seen = true;
                //echo "$i,";
                return $edge;
            }
        }
    }
    return false;
}

function pointExists(array &$map, $x, $y) {
    return array_key_exists($x,$map) && array_key_exists($y, $map[$x]);
}

function allocateColor($img) {
    static $colors;
    static $colormap;
    static $idx;
    if (empty($colors)) {
        $colors = LoadColors('/usr/X11/share/X11/rgb.txt');
        $colormap = array_keys($colors);
        shuffle($colormap);
        $idx = 0;
    }
    if ($idx >= count($colormap)) $idx = 0;
    $name = $colormap[$idx++];
    $rgb = $colors[$name];
    return imagecolorallocate($img, $rgb[0], $rgb[1], $rgb[2]);
}

function insertPolygon($_zone, &$points) {
    global $zonepoly;
    if (empty($points)) return;
    $pts = array();
    foreach ($points as $_e) {
        array_push($pts,$_e->x.' '.$_e->y);
    }
    array_push($pts,$points[0]->x.' '.$points[0]->y);
    try {
        echo "Attempt Insert ".count($pts)."\n";
        $zonepoly->execute(array($_zone['zone_id'], 'POLYGON(('.implode(',',$pts).'))'));
    } catch (Exception $ex) {
        echo "Zone ".$_zone['zone_id']." failed to polygonize\n";
    }
}

function drawZone($img, &$points, $color, $normx = 0, $normy = 0) {
    for ($i=0, $l=count($points), $j=$l-1; $i<$l; $j=$i,++$i) {
        $v1 = $points[$j];
        $v2 = $points[$i];
        imageline($img,
                $v1->x - $normx,
                $v1->y - $normy,
                $v2->x - $normx,
                $v2->y - $normy,
                $color);
    }
}

function drawPoly($img, &$points, $color, $normx = 0, $normy = 0) {
    for ($i=0, $l=count($points), $j=$l-1; $i<$l; $j=$i,++$i) {
        $v1 = $points[$j];
        $v2 = $points[$i];
        imageline($img,
                $v1->x -$normx, $v1->y - $normy,
                $v2->x - $normx, $v2->y - $normy,
                $color);
    }
}

function drawPoints($img, $points, $color, $normx = 0, $normy = 0) {
    foreach ($points as $row) {
        imagesetpixel($img, $row->x-$normx, $row->y-$normy, $color);
    }
}

function drawZonePoints($img, $zone_id, $color,  $normx = 0, $normy = 0, $half = false) {
    global $zonepoints;

    try {
        $zonepoints->execute(array($zone_id));
        $zonepoints->setFetchMode(PDO::FETCH_OBJ);
    } catch (Exception $ex) {
        echo (string)$ex;
        return;
    }
    foreach ($zonepoints as $row) {
        if ($half) {
            imagesetpixel($img, $row->x/2 - $normx, $row->y/2 - $normy, $color);
        } else {
            imagesetpixel($img, $row->x - $normx, $row->y - $normy, $color);
        }
    }
    $zonepoints->closeCursor();
}

function LoadColors($file) {
    $fp = fopen($file,"r");
    $ret = array();
    while (($line = fgets($fp))!==false) {
        if (preg_match('/(black|gr[ae]y|white|negro|white)/i',$line)) continue;
        if (preg_match('/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/',$line,$matches)) {
            $ret[$matches[4]] = array((int)$matches[1],(int)$matches[2],(int)$matches[3]);
        } else {
            echo "BAD LINE:".$line;
        }
    }
    fclose($fp);
    return $ret;
}
?>
