<?php
/**
 * Description of getTameable
 *
 * @author urkle
 */
class ajax_getTameable implements AjaxRequest {
    public static function request($path_args) {
        $tpl = new Template("getTameable.xhtml");

        $tpl->limit = 10;
        $tpl->offset = Util::GetInt('offset',0);
        $tpl->mobs = RO_Mob::findTameable(
                Util::GetInt('player_level',1),
                Util::GetInt('max_power',5),
                RO_Realm::mapRegions(explode(',',Util::GetString('regions','')))
            );
        return $tpl->execute();
    }
}
?>
