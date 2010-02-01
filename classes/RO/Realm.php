<?php
/**
 * Utility functions around a realm
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class RO_Realm {
    private static $map = array(
        'alsius-iz'=>'Alsius Initiation Zone',
        'alsius-ir'=>'Alsius Inner Realm',
        'alsius-wz'=>'Alsius War Zone',
        'ignis-iz'=>'Ignis Initiation Zone',
        'ignis-ir'=>'Ignis Inner Realm',
        'ignis-wz'=>'Ignis War Zone',
        'syrtis-iz'=>'Syrtis Initiation Zone',
        'syrtis-ir'=>'Syrtis Inner Realm',
        'syrtis-wz'=>'Syrtis War Zone',
    );

    private static $realmmap = array(
        'alsius'=>array(
            'Alsius Initiation Zone',
            'Alsius Inner Realm',
            'Alsius War Zone',
        ),
        'ignis'=>array(
            'Ignis Initiation Zone',
            'Ignis Inner Realm',
            'Ignis War Zone',
        ),
        'syrtis'=>array(
            'Syrtis Initiation Zone',
            'Syrtis Inner Realm',
            'Syrtis War Zone',
        ),
        ''=>array()
    );
    /**
     * Maps the short web names to the full DB names
     *
     * @param string $regions The short "webname" for the region
     * @return string
     */
    public static function mapRegions($regions) {
        $ret = array();
        foreach ($regions as $_r) {
            $_r = strtolower($_r);
            if (array_key_exists($_r, self::$map)) {
                array_push($ret, self::$map[$_r]);
            } elseif (array_key_exists($_r, self::$realmmap)) {
                $ret += self::$realmmap[$_r];
            }
        }
        return array_unique($ret);
    }
}
?>
