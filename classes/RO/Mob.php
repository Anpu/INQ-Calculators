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
     * Find Kills to the next Level
     *
     * @param int $player_level     The level of the player
     * @param int $player_xp        The experience of the user
     * @param int $min_level        The minimum level of mobs to search for
     * @param int $max_level        The maximum level of mobs to search for
     * @param array $regions        List of regions to search in
     *
     * @return Iterator the found Mobs
     */
    public static function findKillsToLevel($player_level = 1, $player_xp = null,
                $min_level = 1, $max_level = 3, $regions = array())
    {
        if (!empty($player_xp)) {
            $sql = "CALL GetKillsToLevel(?, ?, ?, ?)";
            $stmt = Database::query($sql, $player_xp, $min_level, $max_level, implode(',',$regions));
        } else {
            $sql = "CALL GetKillsToLevel(XPForLevel(?), ?, ?, ?)";
            $stmt = Database::query($sql, $player_level, $min_level, $max_level, implode(',',$regions));
        }
        $ret = $stmt->fetchAll(PDO::FETCH_OBJ);
        $stmt->closeCursor();
        return new ResultIterator($ret, 'CustomResultSet',array(
            'regions'=>$regions,
            'config'=>array(
                'mob'=>array('key'=>'mob_id','class'=>'RO_Mob'),
            )
        ));
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
