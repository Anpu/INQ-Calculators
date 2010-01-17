<?php
/**
 * Description of getTameable
 *
 * @author urkle
 */
class ajax_getTameable implements AjaxRequest {
    public static function request($path_args) {
        $tpl = new Template("getTameable.xhtml");
        $tpl->mobs = RO_Mob::findTameable(
                Util::GetInt('player_level',1),
                Util::GetInt('lesser_power',0),
                Util::GetInt('beast_power',0),
                Util::GetInt('monster_power',0)
                );
        return $tpl->execute();
    }
}
?>
