<?php
/**
 * Initialize class auto lloader
 */
function AutoLoad($class) {
    $path = strtr($class,'_',DIRECTORY_SEPARATOR).'.php';
    if (file_exists(__DIR__.$path)) {
        require_once __DIR__.$path;
    } else {
        require_once $path;
    }
}
spl_autoload_register('AutoLoad');

if (DEBUG) {
    include 'FirePHPCore/fb.php';
}
?>
