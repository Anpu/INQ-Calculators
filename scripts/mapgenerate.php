#!/bin/env php
<?php
/**
 * @copyright Copyright 2010
 * @author Edward Rudd <urkle at outoforder.cc>
 */
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
if (!defined('__DIR__')) {
    define('__DIR__',dirname(__FILE__));
}
// Pull in the configuration file.. (Yes this actually works)
$config = include __DIR__."/config.php";

// Set debugging if enabled
define('DEBUG',!empty($config->debug));

// Load up the class auto loader
require_once __DIR__."/../classes/Init.php";

include "common.php";

$parser = new Console_CommandLine();
$parser->description = "Converts the raw map tiles into smaller slices with different scales";
$parser->version = "0.0.1";
$parser->addOption('scale',array(
    'long_name'     => '--scale',
    'description'   => 'Scale Factor for the image (numerator:denominator)',
    'default'       => (object)array('num'=>1,'den'=>1),
    'help_name'     => 'SCALE',
    'action'        => 'Scale',
));
$parser->addOption('tilesize',array(
    'long_name'     => '--tilesize',
    'description'   => 'Tile Size',
    'action'        => 'StoreInt',
    'default'       => 256,
    'help_name'     => 'SCALE',
));
$parser->addOption('append',array(
    'long_name'     => '--append',
    'short_name'    => '-a',
    'description'   => 'Append a new layer to,instead of overwriting the map in OUTPUTDIR',
    'action'        => 'StoreTrue',
));
$parser->addArgument('inputmap',array(
    'description'   => 'The input map file to scale/split',
    'help_name'     => 'INPUTFILE',
));
$parser->addArgument('outputdir',array(
    'description'   => 'The output directory for the generated map',
    'optional'      => true,
    'help_name'     => 'OUTPUTDIR',
));

try {
    $args = $parser->parse();
} catch (Exception $ex) {
    $parser->displayError($ex->getMessage());
}

class Rect {
    public $left, $top, $right, $bottom;
    public $width, $height;
    public function __construct($point = null) {
        if (!is_null($point)) {
            $p = Rect::getXY($point);
            $this->left = $p->x;
            $this->right = $p->x;
            $this->top = $p->y;
            $this->bottom = $p->y;
            $this->updateDimensions();
        }
    }

    public function moveTo($left, $top) {
        $this->left = $left;
        $this->top = $top;
        $this->setDimensions($this->width, $this->height);
    }

    public function setDimensions($width, $height) {
        $this->right = $this->left + $width - 1;
        $this->bottom = $this->top + $height - 1;
        $this->updateDimensions();
    }

    public function extendByPoint($point) {
        if ($point instanceof Rect) {
            $this->extendByPoint(array($point->left,$point->top));
            $this->extendByPoint(array($point->right,$point->bottom));
        } else {
            $p = Rect::getXY($point);
            $this->left = min($this->left,$p->x);
            $this->right = max($this->right,$p->x);
            $this->top = min($this->top,$p->y);
            $this->bottom = max($this->bottom,$p->y);
            $this->updateDimensions();
        }
    }

    public function scale($scale, $origin_x = 0, $origin_y = 0) {
        $this->left = ($this->left - $origin_x) * $scale->num / $scale->den + $origin_x;
        $this->top = ($this->top - $origin_y) * $scale->num / $scale->den + $origin_y;
        $this->right = ($this->left + $this->width - $origin_x) * $scale->num / $scale->den + $origin_x - 1;
        $this->bottom = ($this->top + $this->height - $origin_y) * $scale->num / $scale->den + $origin_y - 1;
        $this->updateDimensions();
    }

    public function containsPoint($point) {
        $p = Rect::getXY($point);
        return ($p->x >= $this->left
                && $p->x <= $this->right
                && $p->y >= $this->top
                && $p->y <= $this->bottom);
    }

    public function within(Rect $rect) {
        return ($this->left >= $rect->left
                && $this->top >= $rect->top
                && $this->right <= $rect->right
                && $this->bottom <= $rect->bottom);
    }

    public function __toString() {
        return sprintf("((%d,%d),(%d,%d))",
                $this->left, $this->top,
                $this->right, $this->bottom);
    }

    private function updateDimensions() {
        $this->width = ($this->right - $this->left) + 1;
        $this->height = ($this->bottom - $this->top) + 1;
    }

    private static function getXY($point) {
        if (is_array($point)) {
            if (!array_key_exists('x', $point)) {
                return (object)array('x'=>$point[0],'y'=>$point[1]);
            } else {
                return (object)array('x'=>$point['x'],'y'=>$point['y']);
            }
        } elseif (is_object($point)) {
            if (property_exists($point,'x')) {
                return (object)array('x'=>$point->x,'y'=>$point->y);
            } elseif (property_exists($point,'left')) {
                return (object)array('x'=>$point->left,'y'=>$point->top);
            }
        } else {
            throw new InvalidArgumentException("Unknown Point type");
        }
    }
}

class Map {
    private $file;
    private $pieces;
    private $bounds;

    public function __construct($file = null) {
        if (!is_null($file)) {
            $this->load($file);
        }
    }

    public function load($file) {
        $this->file = $file;
        $xml = simplexml_load_file($this->file);
        $this->pieces = array();
        $basedir = dirname($file);
        foreach ($xml->piece as $_piece) {
            $file = (string)$_piece['file'];
            if ($file[0]=='/') {
                $file = realpath($file);
            } else {
                $file = realpath($basedir.DIRECTORY_SEPARATOR.$file);
            }
            $this->pieces[] = (object)array(
                'file'=>$file,
                'left'=>(int)$_piece['left'],
                'top'=>(int)$_piece['top'],
            );
        }
        $this->bounds = $this->calculateBounds($this->pieces);
    }

    public function scale($scale, $tilesize, $outdir, SimpleXMLElement $layerXML) {
        $newBounds = clone $this->bounds;
        $newBounds->scale($scale, $newBounds->left, $newBounds->top);

        //Check if scale is "even" according to chunk size
        $pieces_x = $newBounds->width / $tilesize;
        if (floor($pieces_x) != $pieces_x) {
            throw new Exception("Uneven number of horizontal pieces would be created: ".$pieces_x);
        }
        $pieces_y = $newBounds->height / $tilesize;
        if (floor($pieces_y) != $pieces_y) {
            throw new Exception("Uneven number of vertical pieces would be created: ".$pieces_y);
        }
        $full_size = $this->bounds->width / $pieces_x;
        echo sprintf("Scaling %d,%d ->(%d/%d)-> %d,%d with %dx%d chunks from (%d,%d)\n",
                $this->bounds->width, $this->bounds->height,
                $scale->num,$scale->den,
                $newBounds->width, $newBounds->height,
                $tilesize, $tilesize,
                $full_size, $full_size);
        $layerXML['width'] = $newBounds->width;
        $layerXML['height'] = $newBounds->height;
        $layerXML['tilesize'] = $tilesize;
        for ($_y = 0; $_y < $pieces_y; $_y++) {
            for ($_x = 0; $_x < $pieces_x; $_x++) {
                $src_rect = new Rect(array($_x * $full_size + $this->bounds->left,
                        $_y * $full_size + $this->bounds->top));
                $src_rect->setDimensions($full_size, $full_size);
                $dst_rect = new Rect(array($_x * $tilesize + $this->bounds->left,
                        $_y * $tilesize + $this->bounds->top));
                $dst_rect->setDimensions($tilesize, $tilesize);
                $file = sprintf("%d_%d.jpg",$dst_rect->top,$dst_rect->left);
                echo "Building piece ",$file,"\n";

                $img = $this->fetchMapSection($src_rect, $dst_rect);
                imageinterlace($img, true);
                imagejpeg($img, $outdir.DIRECTORY_SEPARATOR.$file);
                imagedestroy($img);
                // Write Map XML
                $piece = $layerXML->addChild('piece');
                $piece['file'] = $file;
                $piece['left'] = $dst_rect->left;
                $piece['top'] = $dst_rect->top;
            }
        }
        $layerXML->asXML($outdir.DIRECTORY_SEPARATOR.'layer.xml');
    }

    public function fetchMapSection(Rect $src, Rect $dst = null) {
        if (is_null($dst)) {
            $dst = $src;
        }
        $img = imagecreatetruecolor($dst->width, $dst->height);
        //find pieces from source images
        $point = (object)array('x'=>$src->left, 'y'=>$src->top);
        $_piece = $this->findMapSectionForPoint($point);
        if ($src->within($_piece->bounds)) {
            $src_img = imagecreatefrompng($_piece->file);
            imagecopyresampled($img, $src_img,
                    0, 0, // Destination coords
                    $src->left - $_piece->bounds->left,  // Source X
                    $src->top - $_piece->bounds->top, // Source Y
                    $dst->width, $dst->height,  // destination width and height
                    $src->width, $src->height); // source width and height
        } else {
            // bounds spans across multiple backing images
            throw new Exception("Spanned images not implemented");
        }

        return $img;
    }

    private function findMapSectionForPoint($point) {
        foreach ($this->pieces as $_piece) {
            if ($_piece->bounds->containsPoint($point)) {
                return $_piece;
            }
        }
        return false;
    }

    private function calculateBounds($pieces) {
        foreach ($pieces as $_piece) {
            list($width, $height) = getimagesize($_piece->file);
            $_piece->bounds = new Rect($_piece);
            $_piece->bounds->setDimensions($width, $height);
            if (empty($bounds)) {
                $bounds = clone $_piece->bounds;
            } else {
                $bounds->extendByPoint($_piece->bounds);
            }
        }
        return $bounds;
    }

    public function __set($name,  $value) {
        switch ($name) {
        default:
            throw new InvalidArgumentException("Unknown Parameter ".$name);
        }
    }

    public function __get($name) {
        switch ($name) {
        case 'bounds':
            return $this->bounds;
        case 'bounds_scaled':
            return $this->bounds_scaled;
        default:
            throw new InvalidArgumentException("Unknown Parameter ".$name);
        }
    }
}

// Main Program
$scale = sprintf('%d:%d',$args->options['scale']->num,
        $args->options['scale']->den);
$rpath = sprintf('%d_%d',$args->options['scale']->num,
        $args->options['scale']->den);
$outdir = realpath(empty($args->args['outputdir']) ? '.' : $args->args['outputdir']);
if ($outdir === false || !is_dir($outdir) || !is_writable($outdir)) {
    throw new Exception('Can not write to output directory');
}
echo "Exporting to ".$outdir."\n";

$mapraw = new Map($args->args['inputmap']);
if (file_exists($outdir."/map.xml") && $args->options['append']) {
    $mapxml = new SimpleXMLElement($outdir."/map.xml",null,true);
    if ($mapxml['tilesize'] != $args->options['tilesize']) {
        throw new Exception('Updating existing map with different tilesize');
    }
} else {
    $mapxml = new SimpleXMLElement('<map/>');
    $mapxml['width'] = $mapraw->bounds->width;
    $mapxml['height'] = $mapraw->bounds->height;
    $mapxml['tilesize'] = $args->options['tilesize'];
}

$xpath = $mapxml->xpath('//layer[@scale="'.$scale.'"]');
if (count($xpath)) {
    // Remove it and recreate
    $node = dom_import_simplexml($xpath[0]);
    $node->parentNode->removeChild($node);
}
$layerXML = $mapxml->addChild('layer');
$layerXML['scale'] = $scale;
$layerXML['path'] = $rpath;

if (file_exists($outdir.'/'.$rpath)) {
    if (!is_dir($outdir.'/'.$rpath)
            || !is_writable($outdir.'/'.$rpath)) {
        throw new Exception('Can not write to output directory');
    }
} else {
    mkdir($outdir.'/'.$rpath);
}

$mapraw->scale($args->options['scale'], $args->options['tilesize'],
        $outdir.'/'.$rpath, $layerXML);
$mapxml->asXML($outdir."/map.xml");
?>
