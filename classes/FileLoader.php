<?php
/**
 * Delayed file loader
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class FileLoader {
    private $file;

    public function __construct($file) {
        $this->file = $file;
    }

    function data() {
        return file_get_contents($this->file);
    }
}
?>
