<?php
/**
 * Description of getTameable
 *
 * @author urkle
 */
class ajax_getTameable implements AjaxRequest {
    public static function request($path_args) {
        $tpl = new Template("getTameable.xhtml");
        $regions = explode(',',Util::GetString('regions',''));

        $tpl->limit = 10;
        $tpl->offset = Util::GetInt('offset',0);
        $tpl->mobs = RO_Mob::findTameable(
                Util::GetInt('player_level',1),
                Util::GetInt('max_power',5),
                array_map(array('RO_Realm','mapRegions'),$regions)
            );
        return $tpl->execute();
    }
}
?>
