<?php
// Pull in the configuration file.. (Yes this actually works)
$config = include "config.php";

// Set debugging if enabled
define('DEBUG',!empty($config->debug));

// Load up the class auto loader
require_once "classes/Init.php";

if (!defined('__DIR__')) {
    define('__DIR__',dirname(__FILE__));
}
Template::addTemplatePath(__DIR__.'/templates');
Database::setDSN($config->db->dsn, $config->db->user, $config->db->password);

if (empty($_SERVER['PATH_INFO'])) {
    try {
        $tpl = new Template("index.xhtml");
        $tpl->js = array(
            'ajaxRoot'=>json_encode(Util::AjaxBaseURI())
        );
        $tpl->echoExecute();
    } catch (Exception $ex) {
        die ((string)$ex);
    }
} else {
    try {
        $path_info = explode("/",trim($_SERVER['PATH_INFO'],'/'));
        header("Content-Type: application/json");
        if ($path_info[0]=='ajax' && !empty($path_info[1])
                && preg_match("/^[a-zA-Z]+$/",$path_info[1])) {
            // Process Ajax request
            if (!is_readable(__DIR__.'/ajax/'.$path_info[1].'.php')) {
                throw new Exception('Invalid Request');
            }
            require_once(__DIR__.'/ajax/'.$path_info[1].'.php');
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
