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
 * Base class for object wrappers
 *
 * @copyright Copyright 2010-2011
 * @author Edward Rudd <urkle at outoforder.cc>
 */
abstract class RO_Base {
    private $id;
    private $record;
    protected $extra;

    /** @var Memcached */
    static private $memcache = false;
    static private $memcache_expire = 0;
    static private $cache = array();

    public function  __construct($id, $extra = array())
    {
        $this->record = null;
        $this->id = $id;
        $this->extra = $extra;
    }

    abstract protected function configSQL();
    abstract protected function configCache();

    /**
     * Returns this instances Database record ID
     *
     * @return int
     */
    final public function ID()
    {
        return $this->id;
    }

    final static public function setMemcache(Memcached $cache, $expire = 0) {
        self::$memcache = $cache;
        self::$memcache_expire = $expire;
    }

    final protected function setCache($data)
    {
        list($name, $key) = $this->configCache();
        if (self::$memcache) {
            self::$memcache->set($name.':'.$data->$key, $data, self::$memcache_expire);
        } else {
            self::$cache[$name][$data->$key] = $data;
        }
    }

    final protected function getCache($id)
    {
        list($name, $key) = $this->configCache();
        if (self::$memcache) {
            $val = self::$memcache->get($name.':'.$id);
            if ($val) {
                return $val;
            }
        } else {
            if (!empty(self::$cache[$name][$id])) {
                return self::$cache[$name][$id];
            }
        }
        return null;
    }

    /**
     * Internal method to lazy fetch the data from the database
     */
    final protected function Fetch()
    {
        if (!is_null($this->record)) return;
        $cache = $this->getCache($this->ID());
        if (is_null($cache)) {
            $dbh = Database::get();
            $stmt = $dbh->prepare($this->configSQL());
            $stmt->bindValue(1,$this->ID(), PDO::PARAM_INT);
            $a = $stmt->execute();
            $this->record = $stmt->fetchObject();
            $stmt->closeCursor();
            $this->setCache($this->record);
        } else {
            $this->record = $cache;
        }
    }

    /*** Object access methods **/
    /**
     * Object access override so we can support lazy loading
     *
     * @param string $name
     * @return mixed
     */
    final public function __get($name)
    {
        $this->Fetch();
        if (method_exists($this, $name)) {
            return $this->$name();
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
        $this->Fetch();
        return method_exists($this, $name) || property_exists($this->record, $name);
    }
}
?>
