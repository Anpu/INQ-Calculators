#!/usr/bin/php
<?php
/*
 * This file is part of INQ Calculators.
 *
 * INQ Calculators is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * INQ Calculators is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with INQ Calculators.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @copyright Copyright 2010-2011
 * @author Edward Rudd <urkle at outoforder.cc>
 */
if (!defined('__DIR__')) {
    define('__DIR__',dirname(__FILE__));
}
// Pull in the configuration file.. (Yes this actually works)
$config = include __DIR__."/config.php";

// Set debugging if enabled
define('DEBUG',!empty($config->debug));

// Load up the class auto loader
require_once __DIR__."/../classes/Init.php";

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

function transformPoint(&$matrix,$point) {
    $m = array(
        array($point->x),
        array($point->y),
        array(1),
    );
    $r = matrix_product($matrix, $m);
    return (object)array('x'=>$r[0][0],'y'=>$r[1][0]);
}

function writePolys(Zone $zone, $polys, $file, $filter = 0) {
    $fp = fopen($file, "w");
    fwrite($fp, "ZONE\n".$zone->id."\n");
    fwrite($fp, $zone->name."\n");
    fwrite($fp, $zone->region."\n");
    fwrite($fp, $zone->realm."\n");
    foreach ($polys as $_poly) {
        if (count($_poly) <= $filter) continue;
        $_poly = optimizePoly($_poly);
        fwrite($fp,"POLY ".count($_poly)."\n");
        foreach($_poly as $_p) {
            fwrite($fp, $_p->x." ".$_p->y."\n");
        }
    }
    fclose($fp);
}

function ParseLineString($line) {
    $ret = array();
    if (preg_match("/LINESTRING\(((?:\d+ \d+(?:,\s*)?)+)\)/", $line, $matches)) {
        foreach (preg_split("/,\s*/", $matches[1]) as $_point) {
            $ret[] = preg_split('/\s+/',$_point);
        }
    }
    return $ret;
}

function DiffPointToTextI($a, $b) {
    return ($a[0] - $b[0]).' '.($a[1]- $b[1]);
}

function PointToTextI($p) {
    return $p[0].' '.$p[1];
}

function PolygonToSVGPath(array $ext, array $holes, &$state = null) {
    if (!empty($state)) {
        $path = "m".DiffPointToTextI($ext[0],$state);
    } else {
        $path = "M".PointToTextI($ext[0]);
    }
    $pp = $ext[0];
    $pathP = array();
    for ($i=1;$i<count($ext);++$i) {
        $pathP[] = DiffPointToTextI($ext[$i],$pp);
        $pp = $ext[$i];
    }
    $path .= 'l'.implode(" ",$pathP)."z";
    foreach ($holes as $hole) {
        $path .= "m".DiffPointToTextI($hole[0],$pp);
        $pathP = array();
        $pp = $hole[0];
        for ($i=1;$i<count($hole);++$i) {
            $pathP[] = DiffPointToTextI($hole[$i],$pp);
            $pp = $hole[$i];
        }
        $path .= 'l'.implode(" ",$pathP)."z";
    }
    if (is_array($state)) {
        $state[0] = $pp[0];
        $state[1] = $pp[1];
    }
    return $path;
}

function parsePolygonsFromSVG($file, $bounds) {
    $xml = simplexml_load_file($file);
    $xml->registerXPathNamespace('svg','http://www.w3.org/2000/svg');
    preg_match('/(\d+) (\d+) (\d+) (\d+)/',$xml['viewBox'],$a);

    $svg_width = $a[3];
    $svg_height = $a[4];
    $width = $bounds->width;
    $height = $bounds->height;
    echo "Req ".$width."x".$height."\n";
    echo "SVG ".$svg_width."x".$svg_height."\n";
    $geom = $xml->xpath('//svg:g');
    if (empty($geom)) {
        return array();
    }
    $polys = array();
    echo "Found ".count($geom)." Geometries\n";
    $transform = $geom[0]['transform'];
    $fill = $geom[0]['fill'];
    preg_match('/scale\(([0-9\.\-]+),([0-9\.\-]+)\)/',$transform,$scale);
    preg_match('/translate\(([0-9\.\-]+),([0-9\.\-]+)\)/',$transform,$translate);
    $matrix = array(
        array($scale[1],0,$translate[1]+$bounds->l-2),
        array(0,$scale[2],$translate[2]+$bounds->t-2),
        array(0,0,1),
    );

    foreach ($geom[0]->path as $geomtry) {
        $path = (string)$geomtry['d'];
        preg_match_all('/([a-zA-Z])?([-\d]+)\s+([-\d]+)([zZ]?)/',$path,$points, PREG_SET_ORDER);
        $current = (object)array('x'=>0,'y'=>0);
        $type = '';
        //Start Polygon
        $poly = array();
        for ($i=0,$l=count($points); $i<$l; ++$i) {
            if (!empty($points[$i][1])) {
                $type = $points[$i][1];
            }
            switch($type) {
            case 'M':
            case 'm':
                if ($type == 'm') {
                    $current->x += $points[$i][2];
                    $current->y += $points[$i][3];
                } else {
                    $current->x = $points[$i][2];
                    $current->y = $points[$i][3];
                }
                $poly[] = transformPoint($matrix,
                                    (object)array('x'=>$current->x, 'y'=>$current->y));
                break;
            case 'L':
            case 'l':
                if ($type == 'l') {
                    $current->x += $points[$i][2];
                    $current->y += $points[$i][3];
                } else {
                    $current->x = $points[$i][2];
                    $current->y = $points[$i][3];
                }
                $poly[] = transformPoint($matrix,
                                    (object)array('x'=>$current->x, 'y'=>$current->y));
                break;
            case 'C':
            case 'c':
                // in pairs of 3
                if ($type == 'c') {
                    $current->x += $points[$i+2][2];
                    $current->y += $points[$i+2][3];
                } else {
                    $current->x = $points[$i+2][2];
                    $current->y = $points[$i+2][3];
                }
                $poly[] = transformPoint($matrix,
                                    (object)array('x'=>$current->x, 'y'=>$current->y));
                $i+=2;
                break;
            default:
                echo "Unknown Type:".$type."\n";
            }
            if ($points[$i][4]=='z' || $points[$i][4]=='Z') {
                //close Polygon
                $poly[] = $poly[0];
                $polys[] = $poly;
                $poly = array();
            }
        }
    }
    return $polys;
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

function pointExists(array &$map, $x, $y)
{
    return array_key_exists($x,$map) && array_key_exists($y, $map[$x]);
}

class Zone {
    private $zoneid;
    private $_points;
    private $_pointmap;
    private $props;
    private $_bounds;
    private $_halfbounds;

    public function __construct($_zoneid) {
        $this->zoneid = $_zoneid;
    }

    function __get($name) {
        switch ($name) {
        case 'id':
        case 'zoneid':
            return $this->zoneid;
        case 'points':
            $this->loadZone();
            return $this->_points;
        case 'pointmap':
            $this->loadZone();
            return $this->_pointmap;
        case 'bounds':
            $this->loadBounds();
            return $this->_bounds;
        case 'halfbounds':
            $this->loadBounds();
            return $this->_halfbounds;
        case 'width':
        case 'height':
            return $this->bounds->$name;
        case 'halfwidth':
            return $this->halfbounds->width;
        case 'halfheight':
            return $this->halfbounds->height;
        default:
            if (empty($this->props)) $this->loadProperties();
            if (array_key_exists($name, $this->props)) {
                return $this->props[$name];
            } else {
                throw new Exception("Unknown Variable $name");
            }
        }
    }

    function writePBM($file) {
        $bounds = $this->_halfbounds;

        $fp = fopen($file,"w");
        fwrite($fp, "P1\n# Pixel Map for zone ".$this->zoneid."\n".($this->halfwidth)." ".($this->halfheight)."\n");
        for($y=$bounds->t;$y<=$bounds->b;$y++) {
            $b = array();
            for($x=$bounds->l;$x<=$bounds->r;$x++) {
                $b[] = $this->pointExists($x, $y) ? '1' : '0';
            }
            fwrite($fp, implode(' ',$b)."\n");
        }
        fclose($fp);
    }

    function pointExists($x, $y)
    {
        return array_key_exists($x,$this->pointmap) && array_key_exists($y, $this->pointmap[$x]);
    }

    function loadBounds() {
        if (!empty($this->_bounds)) return;
        global $zonebounds;
        $zonebounds->execute(array($this->zoneid));
        $this->_bounds = $zonebounds->fetchObject();
        $this->_bounds->width = $this->_bounds->r - $this->_bounds->l + 2;
        $this->_bounds->height = $this->_bounds->b - $this->_bounds->t + 2;
        $zonebounds->closeCursor();
        $this->_halfbounds = clone $this->_bounds;
        $this->_halfbounds->l /= 2;
        $this->_halfbounds->r /= 2;
        $this->_halfbounds->t /= 2;
        $this->_halfbounds->b /= 2;
        $this->_halfbounds->width = $this->_halfbounds->r - $this->_halfbounds->l + 1;
        $this->_halfbounds->height = $this->_halfbounds->b - $this->_halfbounds->t + 1;
    }

    function loadProperties() {
        global $zoneinfo;
        $zoneinfo->execute(array($this->zoneid));
        $this->props = $zoneinfo->fetch(PDO::FETCH_ASSOC);
        $zoneinfo->closeCursor();
    }

    function loadZone()
    {
        if (!empty($this->_points)) return;
        global $zonepoints;

        $zonepoints->execute(array($this->zoneid));
        $zonepoints->setFetchMode(PDO::FETCH_ASSOC);
        // Initalize all the points
        $this->_points = array();
        $this->_pointmap = array();
        foreach ($zonepoints as $row) {
            $point = (object)array(
                'x'=>$row['x']/2,
                'y'=>$row['y']/2,
                'seen'=>false,
                'edge'=>false,
            );
            $this->_pointmap[$row['x']/2][$row['y']/2] = $point;
            $this->_points[] = $point;
        }
        $zonepoints->closeCursor();
    }
}

class EdgeTracer {
    private $_edgemap;
    private $_edges;

    private $zone;

    public function __construct($_zone)
    {
        $this->zone = $_zone;
    }

    function __get($name) {
        switch ($name) {
        case 'edges':
            $this->findEdges();
            return $this->_edges;
        case 'edgemap':
            $this->findEdges();
            return $this->_edgemap;
        default:
            throw new Exception("Unknown Variable $name");
        }
    }

    function unseenEdge()
    {
        foreach ($this->edges as $edge) {
            if (!$edge->seen) {
                $edge->seen = true;
                return $edge;
            }
        }
        return false;
    }

    function pointExists($x, $y)
    {
        return array_key_exists($x,$this->edgemap) && array_key_exists($y, $this->edgemap[$x]);
    }

    function findEdges()
    {
        if (!empty($this->_edges)) return;
        $this->_edges = array();
        $this->_edgemap = array();
        // Walk through all points finding edges
        foreach ($this->zone->points as $point) {
            // check surrounding pixel
            if ($this->zone->pointExists($point->x+1, $point->y)
                    && $this->zone->pointExists($point->x-1, $point->y)
                    && $this->zone->pointExists($point->x, $point->y+1)
                    && $this->zone->pointExists($point->x, $point->y-1) ) {
                continue;
            }
            $point->edge = true;
            $this->_edges[] = $point;
            $this->_edgemap[$point->x][$point->y] = $point;
        }
    }

    function findPolys()
    {
        // ok walk the edges and build the polygons
        $polys = array();
        while (($startedge = $this->unseenEdge())!==false) {
            #echo sprintf("finding poly staring @ %d,%d\n",$startedge->x,$startedge->y);
            $poly = array();
            $poly[] = $startedge;
            $curedge = $startedge;
            $angle = 0;
            while (($nextedge = $this->nextEdge($angle, $curedge, $startedge))!==false) {
                $poly[] = $nextedge;
                $angle = rad2deg(atan2($nextedge->y - $curedge->y, $nextedge->x - $curedge->x));
                //echo sprintf("%d,%d -> %d,%d = %d\n",$curedge->x,$curedge->y, $nextedge->x,$nextedge->y,$angle);
                $curedge = $nextedge;
            }
            // append first point to end
            $poly[] = $poly[0];
            $polys[] = $poly;
        }
        return $polys;
    }


    static $checkangles = array(
        0=>array(1, 0 ), //right
        45=>array(1,1), //top right
        -45=>array(1,-1), //bottom right
        90=>array( 0 ,1), //up
        -90=>array(0  ,-1), //down
        135=>array(-1,1), //top left
        -135=>array(-1,-1), //bottom left
        180=>array(-1, 0 ), //left
        '2_0'=>array(2, 0 ), //2 right
        '2_45'=>array(2, 2 ), //2 top right
        '2_-45'=>array(2, -2 ), //2 bottom right
        '2_90'=>array(0  ,2), //2 up
        '2_-90'=>array(0  ,-2), //2 down
        '2_135'=>array(-2, 2), //2 up left
        '2_-135'=>array(-2, -2), //2 down left
        '2_180'=>array(-2, 0 ), //2 left
        63=>array(1,2), // knight up right
        -63=>array(1,-2), // knight down right
        117=>array(-1,2), // knight up left
        -117=>array(-1,-2), // knight down left
        27=>array(2,1), // knight right up
        -27=>array(2,-1), // knight right down
        153=>array(-2,1), // knight left up
        -153=>array(-2,-1), // knight left down
    );

    static $checkorder = array(
        0=>array( 0,
            27, -27,
            45, -45,
            63, -63,
            90, 90,
            117, -117,
            135, -135,
            153, -153),
        45=>array( 45,
            63, 27,
            90, 0,
            117, -27,
            135, -45,
            153, -63,
            180, -90,
            -153, -117),
        -45=>array( -45,
            -63, -27,
            -90, 0,
            -117, 27,
            -135, 45,
            -153, 63,
            180, 90,
            153, 117),
        90=>array( 90,
            117, 63,
            135, 45,
            153, 27,
            180, 0,
            -153, -27,
            -135, -45,
            -117, -63),
        -90=>array( -90,
            -117, -63,
            -135, -45,
            -153, -27,
            180, 0,
            153, 27,
            135, 45,
            117, 63),
        180=>array( 180,
            153, -153,
            135, -135,
            117, -117,
            90, -90,
            63, -63,
            45, -45,
            27, -27),
        27=>array( 27,
            45, 0,
            63, -27,
            90, -45,
            117, -63,
            135, -90,
            153, -117,
            180, -135),
        -27=>array( -27,
            -45, 0,
            -63, 27,
            -90, 45,
            -117, 63,
            -135, 90,
            -153, 117,
            180, 135),
        63=>array(63,
            90, 45,
            117, 27,
            135, 0,
            153, -27,
            180, -45,
            -153, -63,
            -135, -90),
        -63=>array(-63,
            -90, -45,
            -117, -27,
            -135, 0,
            -153, 27,
            180, 45,
            153, 63,
            135, 90),
        135=>array(135,
            153, 117,
            180, 90,
            -135, 63,
            -135, 45,
            -117, 27,
            -90, 0,
            -63, -27),
        -135=>array(-135,
            -153, -117,
            180, -90,
            135, -63,
            135, -45,
            117, -27,
            90, 0,
            63, 27),
        117=>array(117,
            135, 90,
            153, 63,
            180, 45,
            -153, 27,
            -135, 0,
            -117, -27,
            -90, -45),
        -117=>array(-117,
            -135, -90,
            -153, -63,
            180, -45,
            153, -27,
            135, 0,
            117, 27,
            90, 45),
        153=>array(153,
            180, 135,
            -153, 117,
            -135, 90,
            -117, 63,
            -90, 45,
            -63, 27,
            -45, 0),
        -153=>array(-153,
            180, -135,
            153, -117,
            135, -90,
            117, -63,
            90, -45,
            63, -27,
            45, 0),
    );

    /**
     * like nextEdge but does not "consume" the edge
     */
    function checkNextEdge($prevedge, $curedge, $startedge, $count = 0) {
        if ($count >= 3) return true;

        // Checks if there is a "next" edge to throw out STOP problems
        $x = $curedge->x;
        $y = $curedge->y;

        $angle = rad2deg(atan2($curedge->y - $prevedge->y, $curedge->x - $prevedge->x));
        $in = (int)round($angle);
        if (!array_key_exists($in,self::$checkorder)) {
            throw new Exception("Error unknown angle chosen $in\n");
        }
        foreach (self::$checkorder[$in] as $_a) {
            $_p = self::$checkangles[$_a];
            if ($this->pointExists($x + $_p[0], $y + $_p[1])) {
                $nextedge = $this->edgemap[$x + $_p[0]][$y + $_p[1]];
                if ($nextedge === $startedge || !$nextedge->seen && $this->checkNextEdge($curedge, $nextedge, $startedge, $count+1)) {
                    return true;
                }
            }
        }
        //echo sprintf("Found Bad Edge %d,%d\n",$x, $y);
        return false;
    }

    function nextEdge($angle, $curedge, $startedge) {
        $x = $curedge->x;
        $y = $curedge->y;

        $in = (int)round($angle);
        if (!array_key_exists($in,self::$checkorder)) {
            throw new Exception("Error unknown angle chosen $in\n");
        }
        foreach (self::$checkorder[$in] as $_a) {
            $_p = self::$checkangles[$_a];
            if ($this->pointExists($x + $_p[0], $y + $_p[1])) {
                $edge = $this->edgemap[$x + $_p[0]][$y + $_p[1]];

                if (!$edge->seen && $this->checkNextEdge($curedge, $edge, $startedge)) {
                    $edge->seen = true;
                    return $edge;
                }
            }
        }
        return false;
    }
}

class POLYParser {
    private $file;
    private $double;
    public $polys;
    public $zone;
    public $name;
    public $region;
    public $realm;

    public function __construct($file, $double = false)
    {
        $this->file = $file;
        $this->double = $double;
    }

    public function parse()
    {
        $iter = new FileReader($this->file);
        $this->polys = array();
        foreach ($iter as $line) {
            if (strncmp($line, "ZONE", 4) == 0) {
                $this->parseZone($iter);
            } elseif (strncmp($line, "POLY", 4) == 0) {
                $this->polys[] = $this->parsePoly($iter);
            }
        }
    }

    public function parseZone(FileReader $iter)
    {
        $this->zone = (int)$iter->next();
        $this->name = trim($iter->next());
        $this->region = trim($iter->next());
        $this->realm = trim($iter->next());
    }

    public function parsePoly(FileReader $iter)
    {
        $line = $iter->current();
        $d = preg_split('/\s+/', $line, -1, PREG_SPLIT_NO_EMPTY);
        $total = $d[1];
        echo "Parsing $total points\n";
        $count = 0;
        $points = array();
        $iter->next(); // advance to next line
        foreach ($iter as $line) {
            $d = preg_split('/\s+/', $line, -1, PREG_SPLIT_NO_EMPTY);
            if ($this->double) {
                $d[0] *= 2;
                $d[1] *= 2;
            }
            $points[] = (object)array('x'=>$d[0], 'y'=>$d[1]);
            ++$count;
            if ($count == $total) {
                break;
            }
        }
        return $points;
    }
}

class XFIGParser {
    private $file;
    public $polys;

    public function __construct($file)
    {
        $this->file = $file;
    }

    public function parse($bounds)
    {
        $iter = new FileReader($this->file);
        $this->polys = array();
        foreach ($iter as $line) {
            if (strncmp($line, "6 ", 2) == 0) {
                $this->parseCompound($iter, $bounds);
            }
        }
    }

    public function parseCompound(FileReader $iter, $bounds)
    {
        $line = $iter->current();
        $d = preg_split('/\s+/', $line, -1, PREG_SPLIT_NO_EMPTY);
        $fig_bounds = (object)array(
            'l'=>$d[1],
            't'=>$d[2],
            'r'=>$d[3],
            'b'=>$d[4]
        );

        $scale_x = $bounds->width/($fig_bounds->r - $fig_bounds->l);
        $scale_y = $bounds->height/($fig_bounds->b - $fig_bounds->t);
        $trans_x = $bounds->l - ($fig_bounds->l * $scale_x);
        $trans_y = $bounds->b - ($fig_bounds->b * $scale_x);
        echo sprintf("Scale: %f,%f  %f,%f\n",$scale_x, $scale_y, $trans_x, $trans_y);
        $matrix = array(
            array($scale_x,0,$trans_x),
            array(0,$scale_y,$trans_y),
            array(0,0,1),
        );
        $iter->next(); // advance to next line
        foreach ($iter as $line) {
            if (strncmp($line, "3 ", 2) == 0) {
                $this->polys[] = $this->parseSpline($iter, $matrix);
            } elseif (strncmp($line, "-6", 2) == 0) {
                echo "End Compound: ".$iter->key()."\n";
                break;
            }
        }
    }

    public function parseSpline(FileReader $iter, $matrix)
    {
        $line = $iter->current();
        echo "New Spline: ".$iter->key()."\n";
        $d = preg_split('/\s+/', $line, -1, PREG_SPLIT_NO_EMPTY);
        $total = $d[13];
        echo "Parsing $total points\n";
        $count = 0;
        $points = array();
        $state = 1; // fetch points
        $iter->next(); // advance to next line
        foreach ($iter as $line) {
            $d = preg_split('/\s+/', $line, -1, PREG_SPLIT_NO_EMPTY);
            //echo implode(",",$d)."\n";
            switch ($state) {
            case 1:
                $points[] = transformPoint($matrix, (object)array('x'=>$d[0], 'y'=>$d[1]));
                ++$count;
                if ($count == $total) {
                    $state = 2;
                    $count = 0;
                }
                break;
            case 2:
                $count += count($d);
                if ($count >= $total) {
                    break 2;
                }
                break;
            }
        }
        // finished spline
        echo "Ending Spline: ".$iter->key()."\n";
        return $points;
    }
}

class FileReader implements Iterator {
    private $fp;
    private $line;
    private $linenumber;

    public function __construct($file)
    {
        $this->fp = fopen($file, "r");
        $this->linenumber = 0;
        $this->next();
    }

    public function __destruct()
    {
        fclose($this->fp);
    }

    public function current()
    {
        return $this->line;
    }

    public function key()
    {
        return $this->linenumber;
    }

    public function next()
    {
        $this->line = fgets($this->fp);
        if ($this->line !== false) {
            ++$this->linenumber;
        }
        return $this->line;
    }

    public function valid()
    {
        return $this->line !== false;
    }

    public function rewind()
    {
        //noop
    }
}

function getAngle($a, $b) {
    return rad2deg(atan2($b->y - $a->y, $b->x - $a->x));
}

function optimizePoly(array $_poly) {
    $curangle = getAngle($_poly[0], $_poly[1]);
    $ret = array($_poly[0]);
    for ($i=1,$l=count($_poly)-1; $i < $l; ++$i) {
        $angle = getAngle($_poly[$i], $_poly[$i+1]);
        if ($angle != $curangle) {
            $curangle = $angle;
            $ret[] = $_poly[$i];
        }
    }
    $ret[] = $_poly[$i];
    return $ret;
}

function PointToText($p) {
    return $p->x.' '.$p->y;
}
function allocateColor($img) {
    static $colors;
    static $colormap;
    static $idx;
    if (empty($colors)) {
        //$colors = LoadColors('/usr/X11/share/X11/rgb.txt');
        $colors = GenerateColors();
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

function hue2rgb($p, $q, $h) {
    if ($h < 0) $h += 1.0;
    if ($h > 1) $h -= 1.0;
    if (($h * 6.0) < 1.0) return $p + ($q - $p) * 6.0 * $h;
    if (($h * 2.0) < 1.0) return $q;
    if (($h * 3.0) < 2.0) return $p + ($q - $p) * 6.0 * ((2.0 / 3.0) - $h);
    return $p;
}

function HSL2RGB($h, $s, $l) {
    $r = $g = $b = 0;
    if ($s == 0) {
        $r = $g = $b = $l * 255.0;
    } else {
        if ($l < 0.5) {
            $q = $l * ($s + 1.0);
        } else {
            $q = $l + $s - ($l * $s);
        }
        $p = ($l * 2.0) - $q;
        $h = $h / 360.0;
        $r = hue2rgb($p, $q, $h + (1.0/3.0)) * 255.0;
        $g = hue2rgb($p, $q, $h) * 255.0;
        $b = hue2rgb($p, $q, $h - (1.0/3.0)) * 255.0;
    }
    return array((int)$r, (int)$g, (int)$b);
}
//Generate a BUNCH of colors
function GenerateColors() {
    $ret = array();

    for ($h = 0; $h < 360; $h += 15) {
        for ($l = 0.2; $l < 0.7; $l+= 0.1) {
            for ($s = 0.2; $s < 1; $s += 0.1) {
                $ret[] = HSL2RGB($h, $s, $l);
            }
        }
    }
    return $ret;
}

// MAIN

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
    'description'=>'Trace to SVG file using "My algorithm"',
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

$cmd = $parser->addCommand('potrace',array(
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

$cmd = $parser->addCommand('poly',array(
    'description'=>'Convery Poly files (from trace commands) into GIS polygons in a DB',
));
$cmd->addOption('spatialite',array(
    'short_name'    => '-s',
    'description'   => 'Spatialite DB',
    'optional'      => false,
    'help_name'     => 'FILE',
));
$cmd->addOption('table',array(
    'short_name'    => '-t',
    'description'   => 'The Table to insert the geometry',
    'optional'      => false,
    'help_name'     => 'table',
));
$cmd->addArgument('polyfiles',array(
    'multiple'      => true,
    'description'   => 'the Polyfiles to import',
    'optional'      => true,
    'help_name'     => 'zones',
));

$cmd = $parser->addCommand('mapoverlay',array(
    'description'=>'Convert Polygonal data from a spatialite DB into a map overlay file',
));
$cmd->addOption('spatialite',array(
    'short_name'    => '-s',
    'description'   => 'Spatialite DB',
    'optional'      => false,
    'help_name'     => 'FILE',
));
$cmd->addOption('table',array(
    'short_name'    => '-t',
    'description'   => 'The Table to load the geometry',
    'optional'      => false,
    'help_name'     => 'table',
));
$cmd->addOption('filter',array(
    'short_name'    => '-w',
    'description'   => 'Extra WHERE filter for the main zone query',
    'optional'      => true,
    'help_name'     => 'FILTER',
));
$cmd->addOption('outputfile',array(
    'short_name'    => '-o',
    'description'   => 'Output filename',
    'default'       => 'overlay.json',
    'optional'      => true,
    'help_name'     => 'FILE',
));

$cmd = $parser->addCommand('exportsql',array(
    'description'=>'Convert Polygonal data from a spatialite DB into a raw SQL insert script',
));
$cmd->addOption('spatialite',array(
    'short_name'    => '-s',
    'description'   => 'Spatialite DB',
    'optional'      => false,
    'help_name'     => 'FILE',
));
$cmd->addOption('table',array(
    'short_name'    => '-t',
    'description'   => 'The Table to load the geometry',
    'optional'      => false,
    'help_name'     => 'table',
));
$cmd->addOption('filter',array(
    'short_name'    => '-w',
    'description'   => 'Extra WHERE filter for the main zone query',
    'optional'      => true,
    'help_name'     => 'FILTER',
));
$cmd->addOption('outputfile',array(
    'short_name'    => '-o',
    'description'   => 'Output filename',
    'default'       => 'insert.sql',
    'optional'      => true,
    'help_name'     => 'FILE',
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

$zonebounds = $dbh->prepare("SELECT MIN(y) t, MIN(x) l, MAX(y) b, MAX(x) r FROM $pointstable WHERE zone_id = ?");
$zonepointrange = $dbh->prepare("SELECT y,MIN(x) minx,MAX(x) maxx FROM $pointstable WHERE zone_id = ? GROUP BY y");
$zonepoly = $dbh->prepare("INSERT IGNORE INTO $polytable (zone_id,polygon) VALUES (?, PolyFromText(?))");
$zoneinfo = $dbh->prepare("SELECT * FROM $zonestable WHERE zone_id = ?");
$zonepoints = $dbh->prepare("SELECT x, y FROM $pointstable WHERE zone_id = ? ORDER BY x, y");

if (empty($args->command->args['zoneids'])) {
    $bounds = (object)array('l'=>0,'t'=>0,'b'=>6110,'r'=>6130, 'width'=>6132, 'height'=>6112);
} else {
    $stmt = $dbh->query("SELECT MIN(y) t, MIN(x) l, MAX(y) b, MAX(x) r FROM $pointstable"
            .(empty($args->command->args['zoneids'])?"":" WHERE zone_id IN (".implode(',',$args->command->args['zoneids']).")"));
    $bounds = $stmt->fetchObject();
    $bounds->width = $bounds->r - $bounds->l + 2;
    $bounds->height = $bounds->b - $bounds->t + 2;
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
        $normx = $bounds->l/2;
        $normy = $bounds->t/2;

        $img = imagecreate(
                    $bounds->width/2,
                    $bounds->height/2);
        foreach ($zones as $_zid) {

        }
        break;
    case 'trace':
        $normx = $bounds->l/2 - 5;
        $normy = $bounds->t/2 - 5;

        $width = $bounds->r/2-$bounds->l/2+1;
        $img = imagecreate(
                    $width * 2 +15,
                    $bounds->b/2-$bounds->t/2+10);

        $white = imagecolorallocatealpha($img, 255, 255, 255,127.0);

        echo "Rendering ".count($zones)." zones\n";
        foreach ($zones as $_zid) {
            $_zone = new Zone($_zid);
            $ft = new EdgeTracer($_zone);
            $polys = $ft->findPolys();

            echo sprintf("Drawing %3d (%d polys) %s\n",
                        $_zid,
                        count($polys),
                        $_zone->name
                    );
            $color = allocateColor($img);
            drawPoints($img, $ft->edges, $color, $normx, $normy);
            foreach ($polys as $_poly) {
                if (count($_poly)<=8) {
                    //echo sprintf("Throwing away %d  (%d,%d)\n",count($_poly),$_poly[0]->x,$_poly[0]->y);
                } else {
                    echo "Drawing poly ".count($_poly)."\n";

                    drawPoly($img, $_poly, $color, $normx-5-$width, $normy);
                    imagepng($img, $args->command->options['outputfile']);
                }
            }
            echo "Writing Poly file\n";
            writePolys($_zone, $polys, "trace-".$_zid.".poly", 8);
            #drawPoly($img, $polys, $color);
            #drawZone($img, $polys, $color);
        }


        //echo "Write Map\n";
        //imagepng($img, 'Zone'.'.png');
        imagedestroy($img);
        break;
    case 'potrace':
        echo "Rendering ".count($zones)." zones\n";
        $normx = $bounds->l/2;
        $normy = $bounds->t/2;
        $width = $bounds->r/2-$bounds->l/2+1;
        $height = $bounds->b/2-$bounds->t/2+1;
        $img = imagecreate($width, $height);
        $white = imagecolorallocate($img, 255, 255, 255);

        foreach ($zones as $_zid) {
            $_zone = new Zone($_zid);
            $ft = new EdgeTracer($_zone);
            drawPoints($img, $ft->edges, allocateColor($img), $normx, $normy);

            echo sprintf("Processing Zone %s (%d,%d) - (%d,%d)\n",
                    $_zone->name,
                    $_zone->halfbounds->l, $_zone->halfbounds->t,
                    $_zone->halfbounds->r, $_zone->halfbounds->b);
            $file = 'trace-'.$_zid; //tempnam('./','trace');

            echo sprintf("Write PBM (%d,%d)\n",$_zone->halfwidth, $_zone->halfheight);
            $_zone->writePBM($file.'.pbm');
            echo "Process PBM\n";
            $polys = array();
            exec(sprintf("potrace -b svg -W%d.pt -O1 -n -c -q -u1 -o %s.svg %s.pbm", $_zone->halfwidth, $file, $file));
            echo "Parse SVG\n";
            $polys = parsePolygonsFromSVG($file.'.svg', $_zone->halfbounds);
//            exec(sprintf("potrace -b xfig -W%d.pt -o %s.fig %s.pbm", $_zone->halfwidth, $file, $file));
//            $xf = new XFIGParser($file.'.fig');
//            $xf->parse($_zone->halfbounds);
//            $polys = $xf->polys;
            writePolys($_zone, $polys, $file.'.poly');

            foreach ($polys as $_poly) {
                #var_dump($_poly);
                echo "Rendering Poly for ".$_zid." of size ".count($_poly)."\n";
                $color = allocateColor($img);
                drawPoly($img, $_poly, $color, $normx, $normy);
                imagepng($img, $args->command->options['outputfile']);
            }
        }
        echo "Write PNG file $width x $height\n";
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
    case 'poly':
        if (!empty($args->command->options['spatialite'])) {
            if (empty($args->command->options['table'])) {
                throw new Exception("Must specify Table Name");
            }
            $sdb = new SQLite3($args->command->options['spatialite']);
            $sdb->loadExtension($config->spatialite);
            $insert_final = $sdb->prepare(sprintf("REPLACE INTO %s"
                    ." (zone_id, polygon, realm, region, name)"
                    ." VALUES (:id, CastToMultiPolygon(GeomFromText(:geom,1000)),:realm,:region,:name)",
                $args->command->options['table']
            ));
        }
        $tdb = new SQLite3(':memory:');
        $tdb->loadExtension($config->spatialite);
        $tdb->query("CREATE TABLE poly (ID INT NOT NULL PRIMARY KEY, polygon POLYGON NOT NULL, type INT NOT NULL DEFAULT '0')");
        $insert = $tdb->prepare("INSERT INTO poly (ID, polygon) VALUES (:id,PolyFromText(:poly))");
        $update = $tdb->prepare("UPDATE poly SET type = 1 WHERE ID = :id");
        $check = $tdb->prepare("SELECT COUNT(P2.ID)"
                    ." FROM poly P1, poly P2"
                    ." WHERE P1.ID = :inner AND P2.ID != P1.ID"
                    ." AND Within(P1.polygon, P2.polygon)=1");
        $merge = $tdb->prepare("INSERT INTO poly (ID, polygon, type)"
                    ." SELECT :id, GUnion(polygon), 2 FROM poly WHERE type = 0");
        $diff = $tdb->prepare("REPLACE INTO poly (ID, polygon, type)"
                    ." SELECT P1.ID, Difference(P1.polygon, P2.polygon), P1.type FROM poly P1, poly P2"
                    ." WHERE P1.ID = :outer AND P2.ID = :inner");
        foreach ($args->command->args['polyfiles'] as $_file) {
            $p = new POLYParser($_file, true);
            $p->parse();
            echo "Importing ".$p->name."\n";
            if (count($p->polys)==0) {
                echo "No Polys\n";
                continue;
            }
            $count = 0;
            $gis = '';
            $tdb->query("DELETE FROM poly");
            $insert->clear();
            $insert->bindParam('poly',$gis,SQLITE3_TEXT);
            $insert->bindParam('id',$count,SQLITE3_INTEGER);
            foreach ($p->polys as $_poly) {
                $gis = 'POLYGON(('.implode(',',array_map('PointToText',$_poly)).'))';
                ++$count;
                $insert->execute();
            }
            for ($i=1; $i<=$count; ++$i) {
                $check->bindValue('inner',$i);
                $res = $check->execute();
                $row = $res->fetchArray(SQLITE3_NUM);
                if ($row[0] > 0) {
                    $update->bindValue('id',$i);
                    $update->execute();
                }
                $res->finalize();
            }
            ++$count;
            $merge->bindValue('id',$count);
            $merge->execute();

            $res = $tdb->query("SELECT ID FROM poly WHERE type = 1");
            $diff->bindValue('outer',$count);
            while ($row = $res->fetchArray(SQLITE3_NUM)) {
                echo "Diffing ".$row[0]."\n";
                $diff->bindValue('inner',$row[0]);
                $diff->execute();
            }
            $res->finalize();
            $endpoly = $tdb->querySingle("SELECT AsText(polygon) FROM poly WHERE id = ".(int)$count);
            echo $endpoly."\n";
            if (!empty($insert_final) && !empty($endpoly)) {
                $insert_final->bindValue('id',$p->zone,SQLITE3_INTEGER);
                $insert_final->bindValue('name',$p->name);
                $insert_final->bindValue('region',$p->region);
                $insert_final->bindValue('realm',$p->realm);
                $insert_final->bindValue('geom',$endpoly);
                $insert_final->execute();
            }
        }
        break;
    case 'exportsql':
        if (empty($args->command->options['spatialite'])) {
            throw new Exception("Must specify spatialite DB");
        }
        if (empty($args->command->options['table'])) {
            throw new Exception("Must specify Table Name");
        }
        $sdb = new SQLite3($args->command->options['spatialite']);
        $sdb->loadExtension($config->spatialite);
        $allzones = $sdb->prepare(sprintf("SELECT zone_id FROM %s"
               .(empty($args->command->options['filter']) ? "" : " WHERE %s"),
            $args->command->options['table'], $args->command->options['filter']));
        $getFullPolygon = $sdb->prepare(sprintf("SELECT AsText(polygon) FROM %s WHERE zone_id = :zone",
            $args->command->options['table']));

        $res = $allzones->execute();
        $zones = array();
        $fp = fopen($args->command->options['outputfile'],"w");
        fputs($fp,"DROP TABLE IF EXISTS zonetable;\n");
        fputs($fp,"CREATE TABLE zonetable (zone_id INT UNSIGNED NOT NULL PRIMARY KEY, poly GEOMETRY NOT NULL);\n");
        while ($row = $res->fetchArray(SQLITE3_NUM)) {
            $getFullPolygon->bindValue('zone',$row[0],SQLITE3_INTEGER);
            $res2 = $getFullPolygon->execute();
            $poly = $res2->fetchArray(SQLITE3_NUM);
            $res2->finalize();
            fprintf($fp,"INSERT INTO zonetable (zone_id, poly) VALUES (%d,GeomFromText(%s));\n",
                    $row[0], $dbh->quote($poly[0]));
        }
        fclose($fp);
        break;
    case 'mapoverlay':
        $allzones = $dbh->prepare(sprintf("SELECT zone_id, NumGeometries(geometry), AsText(StartPoint(ExteriorRing(Envelope(geometry)))), "
                ."AsText(PointN(ExteriorRing(Envelope(geometry)),3))"
                ." FROM %s WHERE geometry IS NOT NULL".(empty($args->command->options['filter']) ? "" : " AND %s"),
            $zonestable, $args->command->options['filter']));
        $getPolygon = $dbh->prepare(sprintf("SELECT AsText(ExteriorRing(GeometryN(geometry,:poly))),"
                ."NumInteriorRings(GeometryN(geometry,:poly)) FROM %s WHERE zone_id = :zone",
            $zonestable));
        $getPolygonHole = $dbh->prepare(sprintf("SELECT AsText(InteriorRingN(GeometryN(geometry,:poly),:hole))"
                ." FROM %s WHERE zone_id = :zone",
            $zonestable));


        $allzones->execute();
        $zones = array();
        while ($row = $allzones->fetch(PDO::FETCH_NUM)) {
            //$_zone = new stdClass();
            //$_zone->id = $row[0];

            $svg = array();
            $state = array();
            //$_zone->polygons = array();
            $getPolygon->bindValue('zone',$row[0],PDO::PARAM_INT);
            $getPolygonHole->bindValue('zone',$row[0],PDO::PARAM_INT);
            // Iterate Polygons
            for ($p=1; $p<=$row[1]; ++$p) {
                $polygon = new stdClass();
                $getPolygon->bindValue('poly',$p,PDO::PARAM_INT);
                $getPolygon->execute();
                $poly = $getPolygon->fetch(PDO::FETCH_NUM);
                $getPolygon->closeCursor();
                $polygon->exterior = ParseLineString($poly[0]);
                // Iterate Holes
                $polygon->holes = array();
                $getPolygonHole->bindValue('poly',$p,PDO::PARAM_INT);
                for ($h=1; $h<=$poly[1]; ++$h) {
                    $getPolygonHole->bindValue('hole',$h,PDO::PARAM_INT);
                    $getPolygonHole->execute();
                    $hole = $getPolygonHole->fetch(PDO::FETCH_NUM);
                    $getPolygonHole->closeCursor();
                    $polygon->holes[] = ParseLineString($hole[0]);
                }
                $svg[] = PolygonToSVGPath($polygon->exterior, $polygon->holes, $state);
                //$_zone->polygons[] = $polygon;
            }
            //$_zone->svg = implode('',$svg);
            $pos = explode(' ',substr($row[2],6,-1));
            $pos2 = explode(' ',substr($row[3],6,-1));
            $zones[$row[0]] = array(
                'left'=>(int)$pos[0],
                'top'=>(int)$pos[1],
                'width'=>$pos2[0]-$pos[0],
                'height'=>$pos2[1]-$pos[1],
                'svg'=>implode('',$svg),
            );
        }
        $allzones->closeCursor();
        echo "Exported ".count($zones)." zones to ".$args->command->options['outputfile']."\n";
        file_put_contents($args->command->options['outputfile'], json_encode($zones));
        break;
    default:
        $parser->displayUsage();
}

?>
