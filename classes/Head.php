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

    private static $links;
    private static $combined;
    private static $debugmode = false;

    /**
     * If debug mode is enabled, then file combining and minification is not done
     */
    public static function setDebug($debug = true)
    {
        self::$debugmode = $debug;
    }

    public static function addCSS($link, $flags = Head::ADD_LAST)
    {
        $data = (object)array('link'=>$link,'flags'=>$flags);
        if ($flags & self::ADD_FIRST) {
            array_unshift(self::$links->css, $data);
        } else { // The default is add last
            array_push(self::$links->css, $data);
        }
    }

    public static function addJS($link, $flags = Head::ADD_LAST)
    {
        $data = (object)array('link'=>$link,'flags'=>$flags);
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

    public static function OutputCombined($tag)
    {
        if (substr($tag,0,3)=='css') {
            self::ProcessCSS();
        } else {
            self::ProcessJS();
        }
        if (isset(self::$combined[$tag])) {
            foreach (self::$combined[$tag] as $_f) {
                readfile(WEB_ROOT.DIRECTORY_SEPARATOR.$_f->link);
            }
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

    private static function GetVersionLink($file)
    {
        $real = WEB_ROOT.DIRECTORY_SEPARATOR.$file;
        if (file_exists($real)) {
            $time = @filemtime($real);
            return $file .'?'.$time;
        } else {
            return $file;
        }
    }

    private static function ProcessCSS()
    {
        $ret = array();
        $combine = array();
        $tag = '';
        foreach (self::$links->css as $_css) {
            if ($_css->flags & self::NO_COMBINE) {
                if (!empty($combine)) {
                    $tag = 'css/COMBINED_'.md5($tag);
                    self::$combined[$tag] = $combine;
                    $ret[] = $tag;
                    $combine = array();
                    $tag = '';
                }
                $ret[] = self::GetVersionLink($_css->link);
            } else {
                $tag .= self::GetVersionLink($_css->link).':';
                $combine[] = $_css;
            }
        }
        if (!empty($combine)) {
            $tag = 'css/COMBINED_'.md5($tag);
            self::$combined[$tag] = $combine;
            $ret[] = $tag;
        }
        return $ret;
    }

    private static function ProcessJS()
    {
        $ret = array();
        $combine = array();
        $tag = '';
        foreach (self::$links->js as $_js) {
            if ($_js->flags & self::NO_COMBINE) {
                if (!empty($combine)) {
                    $tag = 'js/COMBINED_'.md5($tag);
                    self::$combined[$tag] = $combine;
                    $ret[] = $tag;
                    $combine = array();
                    $tag = '';
                }
                $ret[] = self::GetVersionLink($_js->link);
            } else {
                $tag .= self::GetVersionLink($_js->link).':';
                $combine[] = $_js;
            }
        }
        if (!empty($combine)) {
            $tag = 'js/COMBINED_'.md5($tag);
            self::$combined[$tag] = $combine;
            $ret[] = $tag;
        }
        return $ret;
    }
}

Head::Init();

?>
