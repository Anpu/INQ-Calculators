<?php
/**
 * Description of getTameable
 *
 * @author urkle
 */
class ajax_findNPCs implements AjaxRequest {
    public static function request($path_args) {
        $tpl = new Template("findNPCs.xhtml");

        $tpl->limit = 20;
        $tpl->offset = Util::GetInt('offset',0);;
        $tpl->npcs = RO_NPC::find(
                Util::GetString('name',''),
                Util::GetString('behavior',''),
                Util::GetString('profession',''),
                RO_Realm::mapRegions(explode(',',Util::GetString('regions','')))
            );
        return $tpl->execute();
    }
}
?>
