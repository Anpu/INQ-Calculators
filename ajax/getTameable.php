<?php
/**
 * Description of getTameable
 *
 * @author urkle
 */
class ajax_getTameable implements AjaxRequest {
    static $map = array(
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
    public static function request($path_args) {
        $tpl = new Template("getTameable.xhtml");
        $regions = explode(',',Util::GetString('regions',''));

        $tpl->limit = 10;
        $tpl->mobs = RO_Mob::findTameable(
                Util::GetInt('player_level',1),
                array_map(array('ajax_getTameable','mapRegions'),$regions)
            );
        return $tpl->execute();
    }

    public static function mapRegions($a) {
        return array_key_exists($a,self::$map) ? self::$map[$a] : $a;
    }
}
?>
