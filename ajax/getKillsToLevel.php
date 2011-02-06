<?php
/*
 * This file is part of INQ Calculators.
 *
 * INQ Calculators is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * INQ Calculators is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with INQ Calculators.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Description of getKillsToLevel
 *
 * @copyright Copyright 2010
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class ajax_getKillsToLevel extends AjaxRequest {
    public static function request($path_args)
    {
        $tpl = new Template("getKillsToLevel.xhtml");

        $tpl->limit = $limit = 20;
        $tpl->offset = $offset = Util::GetInt('offset',0);

        $tpl->results = $results = RO_Mob::findKillsToLevel(
                Util::GetInt('player_level',1),
                Util::GetInt('player_xp',0),
                Util::GetInt('min_level',1),
                Util::GetInt('max_level',3),
                RO_Realm::mapRegions(explode(',',Util::GetString('regions','')))
            );
        $tpl->moreresults = (count($results) > ($offset + $limit));
        return array(
            'offset'=>$offset,
            'limit'=>$limit,
            'total'=>count($results),
            'html'=>$tpl->execute()
        );
    }
}

function phptal_func_calcxp($xp, $chg) {
    if ($chg > 0) {
        return $xp.' + '.$chg;
    } else {
        $val = $xp+$chg;
        return $val ?: null;
    }
}

function phptal_tales_calcxp($src, $nothrow) {
    $exp = Template::SplitSRC($src, $nothrow);

    $args = explode(' ',trim($src));
    if (count($args)!==2) {
        throw new PHPTAL_InvalidVariableNameException("calcxp takes two arguments, XP and CHG.");
    }
    $xp = phptal_tale($args[0]);
    $chg = phptal_tale($args[1]);
    array_unshift($exp,'phptal_func_calcxp('.$xp.','.$chg.')');
    return $exp;
}
?>