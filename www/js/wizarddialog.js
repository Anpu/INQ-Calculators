/**
 * Wizard Dialog
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
(function($) { //hide namespace

$.widget('ooo.wizarddialog', $.ui.dialog, {
    options: {
        stepclass:'step',
        finishclass:'finish',
        errorclass:'error',
        callbacks: {}
    },

    _create: function() {
        this.steps = this.element.find('.'+this.options.stepclass).hide();

        this.intro = this.steps.filter('*[step="intro"]');
        if (this.intro.length == 0) {this.intro = false;}

        this.start = this.steps.filter('*[step="start"]');
        if (this.start.length == 0) {this.start = this.steps.not(this.intro).first();}

        this.thanks = this.steps.filter('*[step="thanks"]');
        if (this.thanks.length == 0) {this.thanks = false;}

        this._initCallbacks();

        // Create the underlying dialog
        $.ui.dialog.prototype._create.apply(this, arguments);
    },

    _initCallbacks: function() {
        var self = this;
        this._CBNext = function(e) {
            self._wizardNext(e);
        };
        this._CBPrev = function(e) {
            self._wizardPrev(e);
        };
        this._CBFinish = function(e) {
            self._wizardFinish(e);
        };
        this._CBPostFinish = function(e) {
            self._wizardPostFinish(e);
        };
        this._CBDone = function(e) {
            self._wizardDone(e);
        };
    },

    _resetWizard: function(noIntro) {
        // hide all steps
        this.steps.hide();
        this.history = [];
        this.current = null;
        // setup step 0
        if (this.intro && !noIntro) {
            this._gotoStep(this.intro);
        } else {
            this._gotoStep(this.start);
        }
    },

    _wizardNext: function(e) {
        var curStep = this.current.attr('step');
        var nextStep = this.current.attr('next');

        var step = null;
        var ret = this._doCallback('finish_'+curStep, e, {current:this.current, next:nextStep});
        if (ret === false) {
            // abort next action
            this.current.find('.'+this.options.errorclass).slideDown();

           return;
        } else if (ret) {
            this.current.find('.'+this.options.errorclass).slideUp();
            step = this.steps.filter('*[step="'+ret+'"]');
            if (step.length == 0) {step = null;}
        }

        if (!step && nextStep) {
            step = this.steps.filter('*[step="'+nextStep+'"]');
            if (step.length == 0) {step = null;}
        }
        if (!step) {
            step = this.current.next();
            if (step.length == 0) {step = null;}
        }
        if (!step) {
            throw 'Could not find next step';
        } else {
            // push history
            this.history.push(this.current);
            this._gotoStep(step);
        }
    },

    _wizardPrev: function(e) {
        var step = this.history.pop();
        this._gotoStep(step);
    },

    _wizardFinish: function(e) {
        var ret = this._doCallback('finish_'+this.current.attr('step'),e,
                {current:this.current,finish:this._CBPostFinish});
        if (ret === false) {
            this.current.find('.'+this.options.errorclass).slideDown();
            return;
        } else {
            this.current.find('.'+this.options.errorclass).slideUp();
        }
        if (ret !== true) {
            this._wizardPostFinish(e);
        }
    },
    _wizardPostFinish: function(e) {
        if (!this.thanks) {
            this._wizardDone(e);
        } else {
            this._gotoStep(this.thanks);
        }
    },
    _wizardDone: function() {
        this.close();
    },

    _gotoStep: function(step) {
        if (this.current) {
            this.current.slideUp();
            this._doCallback('enter_'+step.attr('step'), 0, {current:step, previos:this.current});
            step.slideDown();
        } else {
            this._doCallback('enter_'+step.attr('step'), 0, {current:step, previos:this.current});
            step.show();
        }
        this.current = step;
        this._updateButtons();
    },

    _doCallback: function(callback, event, data) {
        var fn = this.options.callbacks[callback];
        var ret;
        event = $.Event(event);
        var e = callback.indexOf('_') < 0 ? callback : callback.substr(0,callback.indexOf('_'));
        event.type = this.widgetEventPrefix + e;

        if ($.isFunction(fn)) {
            ret = fn.call(this.element[0], event, data || {});
        }
        return ret;
    },

    _updateButtons: function() {
        var idx = this.steps.index(this.current);
        var buttons = {};
        if (this.history.length) {
            buttons["Back"] = this._CBPrev;
        }
        if (this.thanks && this.thanks.index(this.current) > -1) {
            delete buttons["Back"];
            buttons["Done"] = this._CBDone;
        } else if (this.current.hasClass(this.options.finishclass)
                || ((idx == (this.steps.length - 1)) && !this.current.attr('next')) ) {
            buttons["Finish"] = this._CBFinish;
        } else {
            var label = (this.intro && this.intro.index(this.current) > -1) ? "Start" : "Next";
            buttons[label] = this._CBNext;
        }
        this._createButtons(buttons);
    },

    // override open
    open: function() {
        if (this.isOpen()) {return;}
        this._resetWizard();
        $.ui.dialog.prototype.open.apply(this, arguments);
    }
});

$.extend($.ooo.wizarddialog, {
    version: "0.1"
});

})(jQuery);