<?php
/**
 * Custom Result class
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class CustomResultSet {
    private $record;
    private $extra_filter;
    private $obj_cache;

    public function __construct($data) {
        $this->record = $data;
        $this->config = array();
        $this->obj_cache = array();
    }

    private function getCustom($name) {
        if (!array_key_exists($name,$this->obj_cache)) {
            $class = $this->config[$name]['class'];
            $key = $this->config[$name]['key'];
            $obj = new $class($this->record->$key);
            if (!empty($this->extra_filter) && method_exists($obj, 'setExtraFilter')) {
                $obj->setExtraFilter($this->extra_filter);
            }
            $this->obj_cache[$name] = $obj;
        }
        return $this->obj_cache[$name];
    }

    final public function setExtraFilter($filter)
    {
        if (isset($filter->config)) {
            $this->config =& $filter->config;
        }
        $this->extra_filter = $filter;
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
