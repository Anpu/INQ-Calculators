<?php
/**
 * Generic Utilities
 *
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
}
?>
