#!/bin/env php
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
$parser->description = "Convers the raw map tiles into smaller slices with different scales";
$parser->version = "0.0.1";
$parser->addOption('scale',array(
    'long_name'     => '--scale',
    'description'   => 'Scale Factor for the image',
    'default'       => 1,
    'help_name'     => 'SCALE',
));
$parser->addOption('size',array(
    'long_name'     => '--size',
    'description'   => 'Image Size',
    'default'       => 256,
    'help_name'     => 'SCALE',
));
$parser->addArgument('inputmap',array(
    'description'   => 'The input map file to scale/split',
    'help_name'     => 'INPUTFILE',
));
$parser->addArgument('outputdir',array(
    'description'   => 'The output directory for the generated map',
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
        $this->left = ($this->left - $origin_x) * $scale + $origin_x;
        $this->top = ($this->top - $origin_y) * $scale + $origin_y;
        $this->right = ($this->left + $this->width - $origin_x) * $scale + $origin_x - 1;
        $this->bottom = ($this->top + $this->height - $origin_y) * $scale + $origin_y - 1;
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

    public function scale($scale, $size, $outdir) {
        $newBounds = clone $this->bounds;
        $newBounds->scale($scale, $newBounds->left, $newBounds->top);

        //Check if scale is "even" according to chunk size
        $pieces_x = $newBounds->width / $size;
        if (floor($pieces_x) != $pieces_x) {
            throw new Exception("Uneven number of horizontal pieces would be created: ".$pieces_x);
        }
        $pieces_y = $newBounds->height / $size;
        if (floor($pieces_y) != $pieces_y) {
            throw new Exception("Uneven number of vertical pieces would be created: ".$pieces_y);
        }
        $full_size = $this->bounds->width / $pieces_x;
        echo sprintf("Scaling %d,%d ->(%.3f)-> %d,%d with %dx%d chunks from (%d,%d)\n",
                $this->bounds->width, $this->bounds->height,
                $scale,
                $newBounds->width, $newBounds->height,
                $size, $size,
                $full_size, $full_size);
        $map = new SimpleXMLElement("<map/>");
        $map['size'] = $size;
        for ($_y = 0; $_y < $pieces_y; $_y++) {
            for ($_x = 0; $_x < $pieces_x; $_x++) {
                $src_rect = new Rect(array($_x * $full_size + $this->bounds->left,
                        $_y * $full_size + $this->bounds->top));
                $src_rect->setDimensions($full_size, $full_size);
                $dst_rect = new Rect(array($_x * $size + $this->bounds->left,
                        $_y * $size + $this->bounds->top));
                $dst_rect->setDimensions($size, $size);
                $file = sprintf("%d_%d.jpg",$dst_rect->top,$dst_rect->left);
                echo "Building piece ",$file,"\n";

                $img = $this->fetchMapSection($src_rect, $dst_rect);
                imagejpeg($img, $outdir.DIRECTORY_SEPARATOR.$file);
                imagedestroy($img);
                // Write Map XML
                $piece = $map->addChild('piece');
                $piece['file'] = $file;
                $piece['left'] = $dst_rect->left;
                $piece['top'] = $dst_rect->top;
            }
        }
        $map->asXML($outdir.DIRECTORY_SEPARATOR.'map.xml');
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
$map = new Map($args->args['inputmap']);
$map->scale($args->options['scale'], $args->options['size'],$args->args['outputdir']);
?>
