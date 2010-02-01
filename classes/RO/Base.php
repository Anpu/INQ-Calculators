<?php
/**
 * Base class for object wrappers
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
abstract class RO_Base {
    private $id;
    private $record;
    protected $extra;
    static private $cache = array();

    public function  __construct($id, $extra)
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

    final protected function setCache($data)
    {
        list($name, $key) = $this->configCache();
        self::$cache[$name][$data->$key] = $data;
    }

    final protected function getCache($id)
    {
        list($name, $key) = $this->configCache();
        if (!empty(self::$cache[$name][$id])) {
            return self::$cache[$name][$id];
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
