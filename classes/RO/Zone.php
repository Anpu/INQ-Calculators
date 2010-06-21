<?php
/**
 * Represents a zone
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
        return "SELECT * FROM zones WHERE zone_id = ?";
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

    protected function mobs()
    {
        $min_level = empty($this->extra->min_level) ? null : $this->extra->min_level;
        $max_level = empty($this->extra->max_level) ? null : $this->extra->max_level;
        $stmt = Database::query("CALL GetAreaMobs(?,?,?)",$this->ID(),$min_level, $max_level);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return new ResultIterator($rows,'RO_Mob');
    }
}
?>
