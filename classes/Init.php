<?php
/**
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

define("CLASS_ROOT",dirname(__FILE__).DIRECTORY_SEPARATOR);
set_include_path(CLASS_ROOT . PATH_SEPARATOR . get_include_path());

/**
 * Initialize class auto loader
 */
function AutoLoad($class) {
    if ($class=='PEAR_Error') $class = 'PEAR';
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
