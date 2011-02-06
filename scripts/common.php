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
 * @copyright Copyright 2010-2011
 * @author Edward Rudd <urkle at outoforder.cc>
 */
class ActionScale extends Console_CommandLine_Action {
    public function execute($value = false, $params = array()) {
        try {
            $scale = Scale::parse($value);
        } catch (Exception $ex) {
            throw new Exception(sprintf(
                'Option "%s" must be 2 integeres separated by a colon (:)',
                $this->option->name
            ));
        }
        $this->setResult($scale->simplify());
    }
}

Console_CommandLine::registerAction("Scale", "ActionScale");


class Scale {
    public $num;
    public $den;
    function __construct($num, $den) {
        $this->num = $num;
        $this->den = $den;
    }

    static function parse($scale) {
        $p = explode(':', trim($scale));
        if (count($p) != 2) {
            throw new Exception('Scale \''.$scale.'\' does not contain only two components');
        }
        return new Scale($p[0],$p[1]);
    }

    function simplify() {
        $a = $this->num;
        $b = $this->den;
        for ($r = $a % $b;
            $r != 0;
            $a = $b, $b = $r, $r = $a % $b);

        return new Scale($this->num / $b, $this->den / $b);
    }

    function scale(Scale $scale) {
        return new Scale($this->num * $scale->num, $this->den * $scale->den);
    }

    function unscale(Scale $scale) {
        return new Scale($this->num * $scale->den, $this->den * $scale->num);
    }
}
?>
