<?php
/**
 * Basic iterator to generate a sequence of numbers
 *
 *  @author Edward Rudd <urkle at outoforder.cc>
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
