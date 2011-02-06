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
 * @copyright Copyright 2010
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

include "common.php";

$parser = new Console_CommandLine();
$parser->description = "Convers the raw spell icons into strips for the trainer";
$parser->version = "0.0.1";
$parser->addOption('newsize',array(
    'long_name'     => '--size',
    'description'   => 'Size of new icons',
    'default'       => 64,
    'help_name'     => 'SIZE',
    'action'        => 'StoreInt',
));
$parser->addOption('prefix',array(
    'long_name'     => '--prefix',
    'description'   => 'The output filename prefix',
    'default'       => 'trainer-icon-',
    'help_name'     => 'PREFIX',
));
$parser->addArgument('mapfile',array(
    'description'   => 'The input JSON map file process',
    'help_name'     => 'INPUTFILE',
));
$parser->addArgument('outputdir',array(
    'description'   => 'The output dir for images',
    'help_name'     => 'OUTPUTDIR',
));

try {
    $args = $parser->parse();
} catch (Exception $ex) {
    $parser->displayError($ex->getMessage());
}
$map = json_decode(file_get_contents($args->args['mapfile']));
$size = $args->options['newsize'];
$imagedir = dirname($args->args['mapfile']);
$imageunused = $imagedir.DIRECTORY_SEPARATOR.'unused';
if (!is_dir($imageunused)) {
    mkdir($imageunused);
}
$d = dir($imageunused);
while (false !== ($entry = $d->read())) {
    if ($entry[0]=='.') continue;
    unlink($imageunused.DIRECTORY_SEPARATOR.$entry);
}
$d->close();

$used = array();

foreach ($map as $discipline=>$spells) {
    $gd = imagecreatetruecolor($size * count($spells), $size);
    $offset = 0;
    foreach ($spells as $spell) {
        if (in_array($spell.'.png',$used)) {
            throw new Exception("Duplicate Spell Used: ".$spell);
        }
        $used[] = $spell.'.png';
        $src = imagecreatefrompng($imagedir.DIRECTORY_SEPARATOR.$spell.'.png');
        $insize = imagesx($src);
        imagecopyresized($gd, $src,
                $offset, 0, 0, 0,
                $size, $size,
                $insize, $insize);
        $offset += $size;
        imagedestroy($src);
    }
    $file = $args->args['outputdir'].DIRECTORY_SEPARATOR.$args->options['prefix'].str_replace(" ","",$discipline).'.jpg';
    echo "Writing $file\n";
    imageinterlace($gd, true);
    imagejpeg($gd, $file);
}

$d = dir($imagedir);
while (false !== ($entry = $d->read())) {
    if ($entry[0]=='.') continue;
    if (in_array($entry, $used)) continue;
    $p = pathinfo($entry);
    if (empty($p['extension']) || $p['extension']!='png') continue;
    symlink('../'.$entry,$imageunused.DIRECTORY_SEPARATOR.$entry);
}
$d->close();