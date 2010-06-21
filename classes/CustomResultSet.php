<?php
/**
 * Custom Result class
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
class CustomResultSet implements ResultIteratorObject {
    private $record;
    private $extra;
    private $config;
    private $obj_cache;

    public function __construct($data, $extra) {
        $this->record = $data;
        $this->extra = $extra;
        if (property_exists($this->extra, 'config')) {
            $this->config =& $this->extra->config;
        } else {
            $this->config = array();
        }
        $this->obj_cache = array();
    }

    private function getCustom($name) {
        if (!array_key_exists($name,$this->obj_cache)) {
            $class = $this->config[$name]['class'];
            $key = $this->config[$name]['key'];
            $obj = new $class($this->record->$key, $this->extra);
            $this->obj_cache[$name] = $obj;
        }
        return $this->obj_cache[$name];
    }

    /*** Object access methods **/
    /**
     * Object access override
     *
     * @param string $name
     * @return mixed
     */
    final public function __get($name)
    {
        if (array_key_exists($name, $this->config)) {
            return $this->getCustom($name);
        } else {
            return $this->record->$name;
        }
    }

    /**
     * Object Access override. Checks for existing instance variables
     *
     * @param string $name
     * @return bool
     */
    final public function __isset($name)
    {
        return array_key_exists($name, $this->config) || property_exists($this->record, $name);
    }
}
?>
