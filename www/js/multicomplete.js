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
 * Auto complete widget with multiple entry support
 * Based on the example http://jqueryui.com/demos/autocomplete/multiple-remote.html
 * @copyright Copyright 2010-2011
 * @author Edward Rudd <urkle at outoforder.cc>
 */
(function($) { // hide namespace

$.widget('ooo.basecomplete', $.ui.autocomplete, {
    _create: function() {
         $.ui.autocomplete.prototype._create.apply(this, arguments);
    },
    _renderItem: function( ul, item ) {
        if (this.options.renderItem) {
            return this.options.renderItem.apply(this.element[0],arguments)
                .data("item.autocomplete",item);
        } else {
			return $.ui.autocomplete.prototype._renderItem.apply(this, arguments);
		}
    }
});

$.widget('ooo.multicomplete', $.ooo.basecomplete, {
    _create: function() {
        this._realsource = $.proxy($.ooo.multicomplete.source,this);
        this.options.search = $.proxy($.ooo.multicomplete.search,this);
        this.options.focus = $.proxy($.ooo.multicomplete.focus,this);
        this.options.select = $.proxy($.ooo.multicomplete.select,this);
         $.ooo.basecomplete.prototype._create.apply(this, arguments);
    },
    _initSource: function() {
        $.ui.autocomplete.prototype._initSource.apply(this,arguments);
        // now perform replacement magic
        this._confsource = this.source;
        this.source = this._realsource;
    }
});


$.extend($.ooo.multicomplete, {
    version: "0.1",
    split: function(val) {
        return val.split( /,\s*/ );
    },
    extractLast: function (term) {
        return $.ooo.multicomplete.split( term ).pop();
    },
    source: function( request, response ) {
        request.full = request.term;
        request.term = $.ooo.multicomplete.extractLast(request.full);
        this._confsource.call(this.element[0], request, response);
    },
    search: function() {
        // custom minLength
        var term = $.ooo.multicomplete.extractLast( this.element.val() );
        if ( term.length < this.options.minLength ) {
            return false;
        }
    },
    focus: function() {
        // prevent value inserted on focus
        return false;
    },
    select: function( event, ui ) {
        var terms = $.ooo.multicomplete.split( this.element.val() );
        // remove the current input
        terms.pop();
        // add the selected item
        terms.push( ui.item.value );
        // add placeholder to get the comma-and-space at the end
        terms.push( "" );
        this.element.val(terms.join( ", " ));
        return false;
    }
});

})(jQuery);