<?php
/**
 * Class wrapper around a Mob
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class RO_NPC extends RO_Base {
    protected function configSQL()
    {
        return "SELECT * FROM npcs WHERE npc_id = ?";
    }

    protected function configCache()
    {
        return array('npcs','npc_id');
    }

    protected function zone()
    {
        return new RO_Zone($this->zone_id);
    }

    /**
     * Find NPCs
     *
     * @param string $name         The name of the NPC (or beginning prefix)
     * @param string $behavior     Filter by the behavior of the NPC (Merchant, Trainer, etc..)
     * @param string $profession   Filter by the profession of the NPC
     * @param array $regions       List of regions to search in
     *
     * @return Iterator the found Mobs
     */
    public static function find($name = '', $behavior = '', $profession = '', $regions = array())
    {
        $sql = "CALL FindNPCs(?, ?, ?, ?)";
        $stmt = Database::query($sql, $name, $behavior, $profession, implode(',',$regions));
        $ret = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt->closeCursor();
        return new ResultIterator($ret, __CLASS__);
    }
}
?>
