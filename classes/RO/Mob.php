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
     * @param int $maxpower         The max spell power to return mobs for
     * @param array $regions       List of regions to search in
     *
     * @return Iterator the found Mobs
     */
    public static function findTameable($player_level = 1, $maxpower = 5, $regions = array())
    {
        $sql = "CALL GetTameableMobs(?, ?, ?)";
        $stmt = Database::query($sql, $player_level, $maxpower, implode(',',$regions));
        $ret = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt->closeCursor();
        return new ResultIterator($ret, __CLASS__,array('regions'=>$regions));
    }

    /**
     * Find Mob by name
     *
     * @param string $name         The name of the Mob
     * @param array $regions       List of regions to search in
     *
     * @return Iterator the found Mobs
     */
    public static function findByName($name = '', $regions = array())
    {
        $sql = "CALL FindMobs(?, ?)";
        $stmt = Database::query($sql, $name, implode(',',$regions));
        $ret = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt->closeCursor();
        return new ResultIterator($ret, __CLASS__, array('regions'=>$regions));
    }
}
?>
