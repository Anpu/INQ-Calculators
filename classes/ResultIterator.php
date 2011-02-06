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
 * Iterates over a result set
 *
 * @copyright Copyright 2010
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class ResultIterator implements Iterator,ArrayAccess,Countable,SeekableIterator {
    private $results;
    private $classname;
    private $extra;

    private $position;
    private $object;
    private $object_pos;

    /**
     * Construct a generic object iterator
     *
     * @param array $results A list of object IDs
     * @param string $classname  The cass name to instantiate
     * @param array $extra  Extra arguments to pass along to created objects
     */
    public function __construct(array $results, $classname, $extra = array()) {
        $this->results = $results;
        $this->classname = $classname;
        if (!empty($extra)) {
            $this->extra = is_array($extra) ? (object)$extra : $extra;
        }
        $this->object = null;
    }

    /**
     * Internal method to lazily instantiate the returned objects by the iterator
     *
     * @param int $position  The ID of the record to instantiate
     * @return Object
     */
    private function fetchObject($position)
    {
        if (is_null($this->object) || $this->object_pos != $position) {
            $this->object = new $this->classname($this->results[$position], $this->extra);
            $this->object_pos = $position;
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
        return $this->fetchObject($this->position);
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
        return $this->fetchObject($offset);
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
