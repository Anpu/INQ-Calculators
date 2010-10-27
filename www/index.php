<?php
/**
 * Main Controller
 *
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

define('APP_ROOT', dirname(__FILE__) . '/..');

$config = include(APP_ROOT . "/config.php");

// Set debugging if enabled
define('DEBUG',!empty($config->debug));

// Load up the class auto loader
require_once(APP_ROOT . "/classes/Init.php");

FB::setEnabled(DEBUG);

Template::addTemplatePath(APP_ROOT . '/templates');
Database::setDSN($config->db->dsn, $config->db->user, $config->db->password);

if (empty($_GET['PATH_INFO'])) {
    try {
        $tpl = new Template("index.xhtml");
        $tpl->js = array(
            'ajaxRoot'=>json_encode(Util::AjaxBaseURI())
        );
        // Load enablement of tools
        $tpl->tools = $config->tools;
        $tpl->devheader = $config->devheader;
        $tpl->credits = is_array($config->credits)
                ? $config->credits
                : array(array('name'=>'Anonymous','job'=>'I did something?'));
        $tpl->echoExecute();
        if ($config->cachehome) {
            header("Pragma: public");
            header("Cache-Control: maxage=".$config->cachehome);
            header("Expires: ".gmdate('D, d M Y H:i:s',time()+$config->cachehome). ' GMT');
        }
    } catch (Exception $ex) {
        die ((string)$ex);
    }
} else {
    try {
        $path_info = explode("/",trim($_GET['PATH_INFO'],'/'));
        header("Content-Type: application/json");
        if ($path_info[0]=='ajax' && !empty($path_info[1])
                && preg_match("/^[a-zA-Z]+$/",$path_info[1])) {
            // Process Ajax request
            if (!is_readable(APP_ROOT.'/ajax/'.$path_info[1].'.php')) {
                throw new Exception('Invalid Request');
            }
            include_once(APP_ROOT.'/ajax/'.$path_info[1].'.php');
            $class = 'ajax_'.$path_info[1];
            $data = call_user_func(array($class,'request'), array_slice($path_info,2));

            echo json_encode(array(
                'response'=>'success',
                'data'=>$data,
            ));
        } else {
            throw new Exception("Invalid Request");
        }
    } catch(PDOException $ex) {
      echo json_encode(array(
          'response'=>'error',
          'error'=>"Database Error: SQLSTATE:".$ex->getCode(),
      ));
      error_log((string)$ex);
    } catch(Exception $ex) {
        echo json_encode(array(
            'response'=>'error',
            'error'=>(string)$ex,
        ));
    }
}
?>
