<?php
/**
 * Description of getKillsToLevelByArea
 *
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class ajax_getKillsToLevelByArea implements AjaxRequest {
    public static function request($path_args)
    {
        $tpl = new Template("getKillsToLevelByArea.xhtml");

        $tpl->limit = 10;
        $tpl->offset = Util::GetInt('offset',0);

        $tpl->results = RO_Mob::findKillsToLevelByArea(
                Util::GetInt('player_level',1),
                Util::GetInt('player_xp',0),
                Util::GetInt('min_level',1),
                Util::GetInt('max_level',3),
                RO_Realm::mapRegions(explode(',',Util::GetString('regions','')))
            );
        return $tpl->execute();
    }
}
?>