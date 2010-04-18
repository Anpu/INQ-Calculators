<?php
/**
 * Template class to setup PHP TAL
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
class Template extends PHPTAL {
    static private $_template_dirs = array();

    public function __construct($template = false) {
        $this->setTemplateRepository(self::$_template_dirs);
        if (DEBUG) {
            $this->setForceReparse(true);
        }
        parent::__construct($template);
    }

    public static function addTemplatePath($templatedir) {
        self::$_template_dirs[] = $templatedir;
    }
}

class Template_Tales implements PHPTAL_Tales {
    public static function limit($src, $nothrow)
    {
        $p = preg_split("/\s+/", $src, null, PREG_SPLIT_NO_EMPTY);
        if (count($p)==2) {
            $limit = is_numeric($p[0]) ? (int)$p[0] : phptal_tale($p[0]);
            return 'new LimitIterator('.phptal_tales($p[1],$nothrow).',0,'.$limit.')';
        } elseif (count($p)==3) {
            $offset = is_numeric($p[0]) ? (int)$p[0] : phptal_tale($p[0]);
            $limit = is_numeric($p[1]) ? (int)$p[1] : phptal_tale($p[1]);
            return 'new LimitIterator('.phptal_tales($p[2],$nothrow).','.$offset.','.$limit.')';
        } else {
            throw new PHPTAL_InvalidVariableNameException("Incorrect usage of limit modifier.  Usage: limit: [offset] limit TALES");
        }
    }
}

PHPTAL_TalesRegistry::getInstance()->registerPrefix("limit", array('Template_Tales','limit'));
?>
