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
        $tpl->mobs = RO_Mob::findTameable(
                Util::GetInt('player_level',1),
                Util::GetInt('lesser_power',5),
                Util::GetInt('beast_power',5),
                Util::GetInt('monster_power',5)
                );
        return $tpl->execute();
    }
}
?>
