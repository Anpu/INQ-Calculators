<?php
/**
 * Iterates over a result set
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class ResultIterator implements Iterator,ArrayAccess,Countable,SeekableIterator {
    private $results;
    private $classname;
    private $extra_filter;

    private $position;
    private $object;
    private $object_id;

    /**
     * Construct a generic object iterator
     *
     * @param array $results A list of object IDs
     * @param string $classname  The cass name to instantiate
     * @param array $extra_filter  Extra filter arguments to pass along to created objects
     */
    public function __construct(array $results, $classname, $extra_filter = array()) {
        $this->results = $results;
        $this->classname = $classname;
        if (!empty($extra_filter)) {
            $this->extra_filter = is_array($extra_filter) ? (object)$extra_filter : $extra_filter;
        }
        $this->object = null;
    }

    /**
     * Internal method to lazily instantiate the returned objects by the iterator
     *
     * @param int $id  The ID of the record to instantiate
     * @return Object
     */
    private function fetchObject($id)
    {
        if (is_null($this->object) || $this->object_id != $id) {
            $this->object = new $this->classname($id);
            if (!empty($this->extra_filter) && method_exists($this->object, 'setExtraFilter')) {
                $this->object->setExtraFilter($this->extra_filter);
            }
            $this->object_id = $id;
        }
        return $this->object;
    }

    /*** Iterator Methods **/

    public function rewind() {
        $this->position = 0;
        $this->object = null;
    }

    public function next() {
        ++$this->position;
        $this->object = null;
    }

    public function key() {
        return $this->position;
    }

    public function valid() {
        return array_key_exists($this->position, $this->results);
    }

    public function current() {
        return $this->fetchObject($this->results[$this->position]);
    }

    /*** Countable Methods **/

    public function count() {
        return count($this->results);
    }

    /*** Array Access Methods **/

    public function offsetExists($offset) {
        return array_key_exists($offset, $this->results);
    }

    public function offsetGet($offset) {
        return $this->fetchObject($this->results[$offset]);
    }

    public function offsetSet($offset, $value) {
        throw new BadFunctionCallException("This Array is Read Only");
    }

    public function offsetUnset($offset) {
        throw new BadFunctionCallException("This Array is Read Only");
    }

    /*** Seekable Iterator Methods **/
    public function seek($position)
    {
        if (($position >=0 && $position < $this->count()) || $position==0) {
            $this->position = $position;
        } else {
            throw new RangeException("Tried to seek to non existant record ".$position);
        }
    }
}
?>
