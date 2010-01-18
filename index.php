<?php
// Pull in the configuration file.. (Yes this actually works)
$config = include "config.php";

// Set debugging if enabled
define('DEBUG',!empty($config->debug));

// Load up the class auto loader
require_once "classes/Init.php";

Template::addTemplatePath(__DIR__.'/templates');
Database::setDSN($config->db->dsn, $config->db->user, $config->db->password);

if (empty($_SERVER['PATH_INFO'])) {
    try {
        $tpl = new Template("index.xhtml");
        $tpl->js = array(
            'ajaxRoot'=>json_encode(Util::AjaxBaseURI())
        );
        $tpl->levels = new RangeIterator(1, 50);
        $tpl->powers = new RangeIterator(1, 5);
        $tpl->echoExecute();
    } catch (Exception $ex) {
        die ((string)$ex);
    }
} else {
    try {
        $path_info = explode("/",trim($_SERVER['PATH_INFO'],'/'));
        if ($path_info[0]=='ajax' && !empty($path_info[1])
                && preg_match("/^[a-zA-Z]+$/",$path_info[1])) {
            // Process Ajax request
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
    } catch(Exception $ex) {
        echo json_encode(array(
            'response'=>'error',
            'error'=>(string)$ex,
        ));
    }
}
?>
