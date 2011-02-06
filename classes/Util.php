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
 * Generic Utilities
 *
 * @copyright Copyright 2010-2011
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class Util {
    public static function ServerURI()
    {
        $uri = (!empty($_SERVER['HTTPS']))
            ? 'https'
            : 'http';
        if (empty($_SERVER['HTTP_HOST'])) {
            $host = $_SERVER['SERVER_NAME'];
        } else {
            $host = $_SERVER['HTTP_HOST'];
        }
        $uri.='://'.$host;
        $port_in_host = (strpos($host,':')>0);
        if (!$port_in_host && !empty($_SERVER['SERVER_PORT'])
                && (!($_SERVER['SERVER_PORT'] == 80
                || $_SERVER['SERVER_PORT'] == 443))) {
            $uri .= ':'.$_SERVER['SERVER_PORT'];
        }
        return $uri;
    }

    public static function AjaxBaseURI()
    {
        return rtrim(Util::ServerURI().dirname($_SERVER['SCRIPT_NAME']),'/').'/ajax/';
    }

    public static function GetInt($var, $default = 0)
    {
        if (array_key_exists($var, $_GET)) {
            return (int)$_GET[$var];
        } else {
            return $default;
        }
    }

    public static function GetFloat($var, $default = 0.0)
    {
        if (array_key_exists($var, $_GET)) {
            return (float)$_GET[$var];
        } else {
            return $default;
        }
    }

    public static function GetBool($var, $default = false)
    {
        if (array_key_exists($var, $_GET)) {
            return (bool)$_GET[$var];
        } else {
            return $default;
        }
    }

    /**
     *
     * @param string $var
     * @param string $default
     * @return string
     *
     * @todo Add in some kind of validation?
     */
    public static function GetString($var, $default ='')
    {
        if (array_key_exists($var, $_GET)) {
            return (string)$_GET[$var];
        } else {
            return $default;
        }
    }
}
?>
