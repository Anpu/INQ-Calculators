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

    protected function mobs()
    {
        FB::log($this->extra);
        $min_level = empty($this->extra->min_level) ? null : $this->extra->min_level;
        $max_level = empty($this->extra->max_level) ? null : $this->extra->max_level;
        $stmt = Database::query("CALL GetAreaMobs(?,?,?)",$this->ID(),$min_level, $max_level);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return new ResultIterator($rows,'RO_Mob');
    }
}
?>
