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
 * Basic iterator to generate a sequence of numbers
 *
 * @copyright Copyright 2010
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class RangeIterator implements Iterator {
    private $start;
    private $stop;
    private $increment;

    private $current;
    /**
     * Construct the iterator
     *
     * @param int $start        The starting number
     * @param int $stop         The ending number
     * @param int $increment    The increment (default 1)
     */
    public function  __construct($start, $stop, $increment = 1) {
        $this->start = $start;
        $this->stop = $stop;
        $this->increment = $increment;

        $this->rewind();
    }

    public function current() {
        return $this->current;
    }

    public function key() {
        return $this->current;
    }

    public function next() {
        $this->current += $this->increment;
    }

    public function rewind() {
        $this->current = $this->start;
    }

    public function valid() {
        return $this->current <= $this->stop;
    }
}
?>
