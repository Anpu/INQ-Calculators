<?php
/**
 * Description of suggestNPCs
 *
 * @copyright Copyright 2010
 * @author Edward Rudd <urkle at outoforder.cc>
 */
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
class ajax_suggestNPCs implements AjaxRequest {
    public static function request($path_args) {
        $result = RO_NPC::suggest(Util::GetString('term'));
        $ret = array();
        foreach ($result as $val) {
            $ret[] = array(
                'label'=>$val->name,
                'realm'=>$val->zone->realm,
                'region'=>$val->zone->region,
            );
        }
        return $ret;
    }
}
?>
