(function($) { //hide namespace

function prefixNumber(number, prefix, digits) {
    var n = parseInt(number).toString();
    var ret = '';
    for (var i=0,l=digits-n.length; i<l; i++) {
        ret += prefix;
    }
    return ret + n;
}

$.widget('ui.digitPicker', {
    _init: function() {
        this._selected = [];
        this._popup = null;
        this._rows = [];
        this._digits = this._getData('max').toString().length;
        this.element
            .addClass('digitPicker '+this._getData('class'))
            .disableSelection();
        this.setValue(this._getData('defaultValue'));

        var self = this;
        this.element.bind('click',function() {
            if (self._popup) {
                self._clearPicker();
            } else {
                self._startPicker();
            }
        });
        $('.digitPicker-popup > .digitPicker-row > .digitPicker-cell').live('click',this._chooseDigitDelegate);
    },
    destroy: function() {
        this.element
            .removeClass('digitPicker '+this._getData('class'))
            .enableSelection();

        $.widget.prototype.destroy.apply(this, arguments);
    },
    setValue: function(value) {
        this._value = value;
        this.element.text(prefixNumber(value,'0',this._digits));
    },
    value: function() {
        return this._value;
    },
    _startPicker: function() {
        this._clearPicker();

        var off = this.element.offset();
        this._popup = $('<div/>')
            .addClass('digitPicker-popup')
            .css({
                left:off.left+this.element.width(),
                top:off.top+this.element.height()
            })
            .data('digitPicker',this)
            .appendTo(document.body);
        this._generateRow(0);
    },
    _clearPicker: function() {
        if (this._popup) {
            this._popup
                .removeData('digitPicker')
                .remove();
        }
        this._popup = null;
        this._selected = [];
        this._rows = [];
    },
    _generateRow: function(index) {
        // Find range of digits
        var digit = this._digits - index;
        var mult = Math.pow(10, digit-1);

        while (this._rows.length > index) {
            this._rows.pop().remove();
        }

        var row = $('<div/>')
            .addClass('digitPicker-row');
        var cur = 0;
        for (var i=0; i<index; i++) {
            cur += this._selected[i];
        }
        var min = this._getData('min');
        var max = this._getData('max');
        /** Todo Make this more robust and handle minimums > 9 */
        i = (digit == 1 && cur < min ) ? min : 0;
        var m = mult*9;

        for (; i<=m && (cur+i) <= max; i+=mult) {
            $('<span/>')
                .addClass('digitPicker-cell')
                .attr({digit:index,value:i})
                .text(prefixNumber(i,'0',digit))
                .appendTo(row);
        }
        row
            .appendTo(this._popup)
            .css('marginLeft',row.height()*index);
        this._rows[index] = row;
    },
    _chooseDigitDelegate: function() {
        var self = $(this).closest('.digitPicker-popup').data('digitPicker');
        self._chooseDigit(this);
    },
    _chooseDigit: function(chosen) {
        var c = $(chosen);
        c.addClass('digitPicker-cell-active')
            .siblings()
            .removeClass('digitPicker-cell-active');
        var digit = parseInt(c.attr('digit'));
        this._selected[digit] = parseInt(c.attr('value'));
        var cur = 0;
        for (var i=0; i<=digit; i++) {
            cur += this._selected[i];
        }
        if (digit+1 >= this._digits || cur == this._getData('max')) {
            this.setValue(cur);
            this._clearPicker();
        } else {
            this._generateRow(digit+1);
        }
    }
});

$.extend($.ui.digitPicker, {
    version: "0.0.1",
    getter: "value",
    defaults: {
        'class': '',
        'defaultValue':0,
        'min':0,
        'max':99
    }
});

})(jQuery);