<?php
define("CLASS_ROOT",dirname(__FILE__).DIRECTORY_SEPARATOR);
set_include_path(CLASS_ROOT . PATH_SEPARATOR . get_include_path());

/**
 * Initialize class auto loader
 */
function AutoLoad($class) {
    $path = strtr($class,'_',DIRECTORY_SEPARATOR).'.php';
    if (file_exists(CLASS_ROOT.$path)) {
        require_once CLASS_ROOT.$path;
    } else {
        require_once $path;
    }
}
spl_autoload_register('AutoLoad');

if (DEBUG) {
    include 'FirePHPCore/fb.php';
}
?>
