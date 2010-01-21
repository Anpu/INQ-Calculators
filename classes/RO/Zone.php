<?php
/**
 * Represents a zone
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class RO_Zone extends RO_Base {
    protected function configSQL()
    {
        return "SELECT * FROM zones WHERE zone_id = ?";
    }

    protected function configCache()
    {
        return array('zones','zone_id');
    }
}
?>
