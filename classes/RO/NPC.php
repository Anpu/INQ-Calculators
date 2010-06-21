<?php
/**
 * Class wrapper around a Mob
 *
 * @copyright Copyright 2010
 * @author Edward Rudd <urkle at outoforder.cc>
 */
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
