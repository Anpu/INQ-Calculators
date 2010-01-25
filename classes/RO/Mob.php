<?php
/**
 * Class wrapper around a Mob
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class RO_Mob extends RO_Base {
    protected function configSQL()
    {
        return "SELECT * FROM mobs WHERE mob_id = ?";
    }

    protected function configCache()
    {
        return array('mobs','mob_id');
    }

    protected function zones()
    {
        if (empty($this->extra_filter->regions)) {
            $regions = '';
        } else {
            $regions = implode(',',$this->extra_filter->regions);
        }
        $stmt = Database::query("CALL GetMobAreas(?,?)",$this->ID(),$regions);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return new ResultIterator($rows,'RO_Zone');
    }

    /**
     * Find tameable mobs for a hunter
     *
     * @param int $player_level     The level of the player
     * @param array $regions       List of regions to search in
     *
     * @return Iterator the found Mobs
     */
    public static function findTameable($player_level = 1, $regions = array())
    {
        $sql = "CALL GetTameableMobs(?, ?)";
        $stmt = Database::query($sql, $player_level, implode(',',$regions));
        $ret = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt->closeCursor();
        return new ResultIterator($ret, __CLASS__,array('regions'=>$regions));
    }
}
?>
