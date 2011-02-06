<?php
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

/**
 * Represents a zone
 *
 * @copyright Copyright 2010-2011
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class RO_Zone extends RO_Base {
    protected static $zone_map = array(
        'Ignis Initiation Zone' => 'ignis_inner',
        'Ignis Inner Realm' => 'ignis_inner',
        'Ignis War Zone' => 'ignis_warzone',
        'ignis_warzone'=>'Ignis War Zone',
        'ignis_inner'=>'Ignis Inner Realms',

        'Syrtis Initiation Zone' => 'syrtis_inner',
        'Syrtis Inner Realm' => 'syrtis_inner',
        'Syrtis War Zone' => 'syrtis_warzone',
        'syrtis_warzone'=>'Syrtis War Zone',
        'syrtis_inner'=>'Syrtis Inner Realms',

        'Alsius Initiation Zone' => 'alsius_inner',
        'Alsius Inner Realm' => 'alsius_inner',
        'Alsius War Zone' => 'alsius_warzone',
        'alsius_warzone'=>'Alsius War Zone',
        'alsius_inner'=>'Alisus Inner Realms',
    );

    protected function configSQL()
    {
        /** Don't pull back geomertry by default */
        return "SELECT zone_id, name, realm, region FROM zones WHERE zone_id = ?";
    }

    protected function configCache()
    {
        return array('zones','zone_id');
    }

    protected function shortID() {
        return self::$zone_map[$this->realm.' '.$this->region];
    }

    protected function shortName() {
        return self::$zone_map[$this->shortID()];
    }

    private $mobs_cache = null;
    protected function mobs()
    {
        if (is_null($this->mobs_cache)) {
            $min_level = empty($this->extra->min_level) ? null : $this->extra->min_level;
            $max_level = empty($this->extra->max_level) ? null : $this->extra->max_level;
            $only_grinding = empty($this->extra->only_grinding) ? null : $this->extra->only_grinding;
            $stmt = Database::query("CALL GetAreaMobs(?,?,?,?)",$this->ID(),$min_level, $max_level, $only_grinding);
            $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $this->mobs_cache = new ResultIterator($rows,'RO_Mob');
        }
        return $this->mobs_cache;
    }

    /*
     * returns data formatted for use on throw map
     */
    protected function mapData() {
        return array(
            'zones'=>array(
                $this->zone_id=>array(
                    'zone_id'=>$this->zone_id,
                    'name'=>$this->name,
                    'realm'=>$this->realm,
            )),
        );
    }

    /*
     * returns data formatted for use on throw map
     */
    protected function mapGrindingData() {
        $data = array();
        foreach ($this->mobs() as $_mob) {
            $data[] = $_mob->name;
        }
        return array('zones'=>array(
            $this->zone_id=>array(
                'zone_id'=>$this->zone_id,
                'name'=>$this->name,
                'realm'=>$this->realm,
                'mobs'=>$data,
            )
        ));
    }

    /**
     * Find Zone by name
     *
     * @param string $name         The name of the Mob
     * @param array $regions       List of regions to search in
     *
     * @return Iterator the found Mobs
     */
    public static function findByName($name = '', $regions = array())
    {
        $sql = "CALL FindZones(?, ?)";
        $stmt = Database::query($sql, $name, implode(',',$regions));
        $ret = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt->closeCursor();
        return new ResultIterator($ret, __CLASS__, array('regions'=>$regions));
    }

    public static function suggest($term = '')
    {
        $sql = "CALL SuggestZones(?)";
        $stmt = Database::query($sql, $term);
        $ret = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt->closeCursor();
        return new ResultIterator($ret, __CLASS__);
    }
}
?>
