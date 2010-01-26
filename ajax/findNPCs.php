<?php
/**
 * Description of getTameable
 *
 * @author urkle
 */
class ajax_findNPCs implements AjaxRequest {
    public static function request($path_args) {
        $tpl = new Template("findNPCs.xhtml");
        $realm = Util::GetString('realm','');

        $tpl->limit = 10;
        $tpl->npcs = RO_NPC::find(
                Util::GetString('name',''),
                Util::GetString('behavior',''),
                Util::GetString('profession',''),
                RO_Realm::RealmToRegions($realm)
            );
        return $tpl->execute();
    }
}
?>
