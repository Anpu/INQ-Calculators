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
        $stmt = Database::query("CALL GetMobAreas(?)",$this->ID());
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return new ResultIterator($rows,'RO_Zone');
    }

    /**
     * Find tameable mobs for a hunter
     *
     * @param int $player_level     The level of the player
     * @param int $lesser_power     The power level of the Tame Lesser spell
     * @param int $beast_power      The power level of the Tame Beast spell
     * @param int $monster_power    The power level of the Control Monster spell
     *
     * @return Iterator the found Mobs
     */
    public static function findTameable($player_level = 1, $player_realm = 'Syrtis', $regions = '',
                $lesser_power = 5, $beast_power = 5, $monster_power = 5)
    {
        $sql = "CALL GetTameableMobs(?, ?, ?, ?, ?, ?)";
        $stmt = Database::query($sql, $player_level, $player_realm, $regions,
                    $lesser_power, $beast_power, $monster_power);
        $ret = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt->closeCursor();
        return new ResultIterator($ret, __CLASS__);
    }
}
?>
