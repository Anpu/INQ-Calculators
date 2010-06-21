<?php
/**
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
class ActionScale extends Console_CommandLine_Action {
    public function execute($value = false, $params = array()) {
        $p = explode(':', trim($value));
        if (count($p) != 2) {
            throw new Exception(sprintf(
                'Option "%s" must be 2 integeres separated by a colon (:)',
                $this->option->name
            ));
        }
        list ($num, $den) = self::simplify($p[0], $p[1]);
        $this->setResult((object)array('num'=>$num,'den'=>$den));
    }
    private static function simplify($num, $den) {
        $a = $num;
        $b = $den;
        for ($r = $a % $b;
            $r != 0;
            $a = $b, $b = $r, $r = $a % $b);

        return array($num / $b, $den / $b);
    }
}

Console_CommandLine::registerAction("Scale", "ActionScale");

?>
