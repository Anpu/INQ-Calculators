<?php
/*
 * Head.php
 *
 * Copyright (c) 2011 Edward Rudd <urkle at outoforder.cc>
 *
 * This file is part of INQ-Calculators.
 *
 * INQ-Calculators is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * INQ-Calculators is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with INQ-Calculators.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Description of Head
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class Head {
    /** If we should NOT combine this file with others */
    const NO_COMBINE    = 0x0001;
    /** If we should NOT minify this file */
    const NO_MINIFY     = 0x0002;

    /** A standalone preminified file */
    const STANDALONE    = 0x0003;

    const ADD_FIRST     = 0x0100;
    const ADD_LAST      = 0x0200;

    const TYPE_CSS      = 1;
    const TYPE_JS       = 3;

    const FEAT_COMBINE  = 0x01;
    const FEAT_MINIFY   = 0x02;
    const FEAT_DEFAULT  = 0x01;

    private static $links;
    private static $combined;
    private static $debug = false;
    private static $memcached = false;
    private static $features = self::FEAT_DEFAULT;

    /**
     * Configure what features are enabled (minification, combination)
     * @param integer $flags  And ored list of Head::FEAT_*  flags
     */
    public static function setFeatures($flags)
    {
        self::$features = $flags;
    }

    /**
     * Configure the caching in memcached
     * @param Memcached $obj  The memcached object to use
     */
    public static function setMemecache(Memcached $obj)
    {
        self::$memcached = $obj;
    }

    /**
     * If debug mode is enabled, then file combining and minification is not done
     */
    public static function setDebug($debug = true)
    {
        self::$debug = $debug;
    }

    public static function addCSS($link, $flags = Head::ADD_LAST)
    {
        $data = (object)array('link'=>$link,'flags'=>$flags,'type'=>self::TYPE_CSS);
        if ($flags & self::ADD_FIRST) {
            array_unshift(self::$links->css, $data);
        } else { // The default is add last
            array_push(self::$links->css, $data);
        }
    }

    public static function addJS($link, $flags = Head::ADD_LAST)
    {
        $data = (object)array('link'=>$link,'flags'=>$flags,'type'=>self::TYPE_JS);
        if ($flags & self::ADD_FIRST) {
            array_unshift(self::$links->js, $data);
        } else { // The default is add last
            array_push(self::$links->js, $data);
        }
    }

    /**
     * Returns all of the processed CSS links
     */
    public static function CSS()
    {
        return self::ProcessCSS();
    }

    /**
     * Returns all of the processed JS links
     */
    public static function JS()
    {
        return self::ProcessJS();
    }

    public static function OutputCombined($tag, $modstamp = 0)
    {
        if (substr($tag,0,3)=='css') {
            self::ProcessCSS();
        } else {
            self::ProcessJS();
        }
        if (self::$memcached) {
            $ret = self::$memcached->get($tag.'-'.$modstamp);
            if ($ret) {
                echo $ret;
                return;
            }
            ob_start();
        }
        if (isset(self::$combined[$tag])) {
            foreach (self::$combined[$tag] as $_f) {
                if ($_f->flags & self::NO_MINIFY || (self::$features & self::FEAT_MINIFY) == 0) {
                    readfile(WEB_ROOT.DIRECTORY_SEPARATOR.$_f->link);
                } else {
                    if ($_f->type == self::TYPE_JS) {
                        try {
                            echo JSMin::minify(
                                    file_get_contents(WEB_ROOT.DIRECTORY_SEPARATOR.$_f->link)
                            );
                        } catch(Exception $ex) {
                            error_log((string)$ex);
                        }
                    } elseif ($_f->type == self::TYPE_CSS) {
                        try {
                            echo Minify_CSS_Compressor::process(
                                    file_get_contents(WEB_ROOT.DIRECTORY_SEPARATOR.$_f->link)
                            );
                        } catch(Exception $ex) {
                            error_log((string)$ex);
                        }
                    }
                }
            }
        }
        if (self::$memcached) {
            self::$memcached->set($tag.'-'.$modstamp, ob_get_contents());
            ob_end_flush();
        }
    }

    /**
     * Static initializer to setup the main data structures
     */
    public static function Init()
    {
        self::$links = (object)array(
            'js'=>array(),
            'css'=>array(),
        );
        self::$combined = array();
    }

    public static function GetVersionLink($file)
    {
        $real = WEB_ROOT.DIRECTORY_SEPARATOR.$file;
        if (file_exists($real)) {
            $time = @filemtime($real);
            return $file .'?t='.$time;
        } else {
            return $file;
        }
    }

    private static function getModStamp($file)
    {
        $real = WEB_ROOT.DIRECTORY_SEPARATOR.$file;
        if (file_exists($real)) {
            return @filemtime($real);
        } else {
            return 0;
        }
    }

    private static function ProcessCSS()
    {
        $ret = array();
        $combine = (object)array(
            'files'=>array(),
            'tag'=>'',
            'stamp'=>'',
        );
        foreach (self::$links->css as $_css) {
            if (self::$debug) {
                $ret[] = self::GetVersionLink($_css->link);
            } elseif ($_css->flags & self::NO_COMBINE || (self::$features & self::FEAT_COMBINE)==0) {
                if (!empty($combine->files)) {
                    $tag = 'css/COMBINED_'.md5($combine->tag);
                    self::$combined[$tag] = $combine->files;
                    $ret[] = $tag.'?t='.md5($combine->stamp);
                    $combine->files = array();
                    $combine->tag = '';
                    $combine->last = '';
                }
                if ($_css->flags & self::NO_MINIFY || (self::$features & self::FEAT_MINIFY)==0) {
                    $ret[] = self::GetVersionLink($_css->link);
                } else {
                    $tag = 'js/MINIFIED_'.md5($_css->link);
                    self::$combined[$tag] = array($_css);
                    $ret[] = $tag.'?t='.self::getModStamp($_css->link);
                }
            } else {
                $combine->tag .= $_css->link.':';
                $combine->stamp .= self::getModStamp($_css->link);
                $combine->files[] = $_css;
            }
        }
        if (!empty($combine->files)) {
            $tag = 'css/COMBINED_'.md5($combine->tag);
            self::$combined[$tag] = $combine->files;
            $ret[] = $tag.'?t='.md5($combine->stamp);
        }
        return $ret;
    }

    private static function ProcessJS()
    {
        $ret = array();
        $combine = (object)array(
            'files'=>array(),
            'tag'=>'',
            'stamp'=>'',
        );
        foreach (self::$links->js as $_js) {
            if (self::$debug) {
                $ret[] = self::GetVersionLink($_js->link);
            } elseif ($_js->flags & self::NO_COMBINE || (self::$features & self::FEAT_COMBINE)==0) {
                if (!empty($combine->files)) {
                    $tag = 'js/COMBINED_'.md5($combine->tag);
                    self::$combined[$tag] = $combine->files;
                    $ret[] = $tag.'?t='.md5($combine->stamp);
                    $combine->files = array();
                    $combine->tag = '';
                    $combine->last = '';
                }
                if ($_js->flags & self::NO_MINIFY || (self::$features & self::FEAT_MINIFY)==0) {
                    $ret[] = self::GetVersionLink($_js->link);
                } else {
                    $tag = 'js/MINIFIED_'.md5($_js->link);
                    self::$combined[$tag] = array($_js);
                    $ret[] = $tag.'?t='.self::getModStamp($_js->link);
                }
            } else {
                $combine->tag .= $_js->link.':';
                $combine->stamp .= self::getModStamp($_js->link);
                $combine->files[] = $_js;
            }
        }
        if (!empty($combine->files)) {
            $tag = 'js/COMBINED_'.md5($combine->tag);
            self::$combined[$tag] = $combine->files;
            $ret[] = $tag.'?t='.md5($combine->stamp);
        }
        return $ret;
    }
}

Head::Init();

?>
