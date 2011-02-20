<?php
/*
 * head.php
 *
 * Copyright (c) 2011 Edward Rudd <urkle at outoforder.cc>
 *
 * This file is part of INQ-Calculators.
 *
 * INQ-Calculators is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * INQ-Calculators is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with INQ-Calculators.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * This file defines the CSS and JS files that are included
 * so that they can be compressed and combined dynamically
 */
if (empty($config)) {
    throw new Exception("Global Config Object not setup!");
}
Head::addCSS('css/themes/inquisition/jquery-ui-1.8.8.custom.css',Head::STANDALONE);
Head::addCSS('css/jquery.qtip.css');
Head::addCSS('css/mapWidget.css');
if (!empty($config->tools['map'])) {
    Head::addCSS('css/jquery.svg.css');
    Head::addCSS('css/interactiveMap.css');
}
Head::addCSS('css/main.css');

Head::addJS('js/jquery-1.4.4.min.js',Head::STANDALONE);
Head::addJS('js/jquery-ui-1.8.8.custom.min.js',Head::STANDALONE);
Head::addJS('js/jquery.qtip.min.js',Head::STANDALONE);
Head::addJS('js/jquery.mousewheel.min.js',Head::NO_MINIFY);
Head::addJS('js/jquery.json.min.js',Head::NO_MINIFY);
Head::addJS('js/jquery.timers-1.2.min.js',Head::NO_MINIFY);
if (!empty($config->tools['trainer'])) {
    Head::addJS('js/Trainer.js');
}
Head::addJS('js/Polygon.js');
Head::addJS('js/mapWidget.js');
if (!empty($config->tools['map'])) {
    Head::addJS('js/jquery.svg.min.js',Head::NO_MINIFY);
    Head::addJS('js/interactiveMap.js');
}
Head::addJS('js/multicomplete.js');
Head::addJS('js/wizarddialog.js');
Head::addJS('js/inqtools.js');
?>
