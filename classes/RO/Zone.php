<?php
/**
 * Represents a zone
 *
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
