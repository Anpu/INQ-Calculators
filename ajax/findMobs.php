<?php
/**
 * Description of getTameable
 *
 * @author urkle
 */
class ajax_findMobs implements AjaxRequest {
    public static function request($path_args) {
        $tpl = new Template("findMobs.xhtml");
        $realm = Util::GetString('realm','');

        $tpl->limit = 20;
        $tpl->offset = Util::GetInt('offset',0);;
        $tpl->mobs = RO_Mob::findByName(
                Util::GetString('name',''),
                RO_Realm::RealmToRegions($realm)
            );
        return $tpl->execute();
    }
}
?>
