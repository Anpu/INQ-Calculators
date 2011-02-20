/*
 * inqtools-trainer.js
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
$(function() {
    window.Trainer = new cTrainer('#trainer_tool');
});

function cbTrainer() {
    var v = $('#char_class').val();
    Trainer.characterClass(v);
}

function cbInitTrainer(loadSetup) {
    var temp;
    if (loadSetup) {
        temp = function() {
            Trainer.decode(loadSetup, function(trainer) {
                $('#char_class').val(trainer.characterClass());
            });
        };
    }
    Trainer.loadData(temp);
}
