(function($) { // hide namespace

$.widget("ui.mapWidget", $.extend({}, $.ui.mouse, {
    _init: function() {
        this._setData('distance', 0);
        this._mouseInit();
        this._maps = {};
        this._editing = false;
        this._setup(true);
        this._editbox = null;
        this._editmaps = null;
        this._editregion = null;
    },

    _setup: function(init) {
        var self = this;

        if (init) {
            this.element.addClass('mapWidget '+this._getData('class'));
            var maps = this._getData('maps');
            for (var m in maps) {
                this._maps[m] = $('<div/>')
                            .addClass('mapWidget-overlay '+maps[m].image);
                if (maps[m].bgoffset) {
                    this._maps[m].css('backgroundPosition',maps[m].bgoffset.css());
                }
                if (maps[m].position) {
                    this._maps[m].css({
                        left:maps[m].position.x,
                        right:maps[m].position.y});
                } else {
                    this._maps[m].css({left:0,right:0});
                }
                this._maps[m].appendTo(this.element);
            }
        }
    },

    _mouseStop: function(e) {
        var offset = this.element.offset();
        var p = new Point(e.pageX-offset.left,e.pageY-offset.top);
        if (this._editing) {
            console.log('Found Point: ',p);
        } else {
            var regs = this._getData('regions');
            var hit = {map:null,region:null};
            for (var map in regs) {
                for (var region in regs[map]) {
                    var poly = regs[map][region].map;
                    if (poly.containsPoint(p)) {
                        hit.map = map;
                        hit.region = region;
                        break;
                    }
                }
            }
            var ret = this._trigger('click', e, hit);
            if ((ret !== false) && hit.map) {
                // set the background position
                this._maps[hit.map].css('backgroundPosition',regs[hit.map][hit.region].offset.css());
            }
        }
    },

    editmode: function(v) {
        if (this._editing === !!v) return;
        this._editing = !!v;
        if (this._editing) {
            this.element.addClass('mapWidget-editing');
            this._editbox = $('<div/>').appendTo('body');
            this.editmode_populate();
            var self = this;
            this._editbox.dialog({
                    title:"Editing Map Widget",
                    autoOpen: true,
                    buttons: {
                        "Generate":function () {
                            alert('this would generate the map');
                        },
                        "Dismiss":function () {
                            $(this).dialog('close');
                        }
                    },
                    close: function() {
                        self.editmode(false);
                    }
                });
        } else {
            this.element.removeClass('mapWidget-editing');
            this._editbox.dialog('destroy');
            this._editbox.remove();
            this._editmaps = null;
            this._editregion = null;
            this._editbox = null;
        }
    },

    editmode_funcs: {
        hoverin: function() {
            $(this).addClass('ui-state-hover');
        },
        hoverout: function() {
            $(this).removeClass('ui-state-hover');
        },
        focusin: function() {
            $(this).addClass('ui-state-focus');
        },
        focusout: function() {
            $(this).removeClass('ui-state-focus');
        }
    },

    editmode_add:function(aMap){

    },
    editmode_edit:function(aMap, aRegion){
        this._editregion = this._editmaps[aMap][aRegion].map.clone();
        for (var i=0,l=this._editregion.getPointCount(); i<l; i++) {
            console.log(this._editregion.getPoint(i));
        }
    },
    editmode_remove:function(aMap, aRegion){

    },
    editmode_populate: function() {
        // add maps to dialog
        var self = this;
        this._editmaps = {};
        var addfunc = function() {
            self.editmode_add($(this).attr('map'));
            return false;
        };
        var editfunc = function() {
            self.editmode_edit($(this).attr('map'),$(this).attr('region'));
            return false;
        };
        var removefunc = function() {
            self.editmode_remove($(this).attr('map'),$(this).attr('region'));
            return false;
        };
        var maps = this._getData('maps');
        var regs = this._getData('regions');
        for (var m in maps) {
            this._editmaps[m] = {};
            var mWMapHeader = $('<div/>')
                .text(m)
                .addClass('mapWidget-editmap')
                .appendTo(this._editbox);
            var mWMapHeaderAdd = $('<a href="#"/>')
                .addClass('mapWidget-editmap-add ui-corner-all')
                .attr({role:'button',map:m})
                .hover(this.editmode_funcs.hoverin, this.editmode_funcs.hoverout)
                .click(addfunc)
                .appendTo(mWMapHeader);
            $('<span/>')
                .addClass("ui-icon ui-icon-plusthick")
                .appendTo(mWMapHeaderAdd);

            if (regs[m]) {
                for (var region in regs[m]) {
                    this._editmaps[m][region] = {
                        offset: regs[m][region].offset,
                        map: regs[m][region].map
                    };
                    var mWRegionHeader = $('<div/>')
                        .addClass('mapWidget-editregion')
                        .appendTo(this._editbox);
                    $('<span/>')
                        .addClass('mapWidget-editregion-indent ui-icon ui-icon-triangle-1-e')
                        .appendTo(mWRegionHeader);
                    $('<a href="#"/>')
                        .addClass('mapWidget-editregion-edit')
                        .attr({map:m, region:region})
                        .text(region)
                        .click(editfunc)
                        .appendTo(mWRegionHeader);
                    var mWRegionHeaderMinus = $('<a href="#"/>')
                        .addClass('mapWidget-editregion-remove ui-corner-all')
                        .attr({role:'button',map:m, region:region})
                        .hover(this.editmode_funcs.hoverin, this.editmode_funcs.hoverout)
                        .click(removefunc)
                        .appendTo(mWRegionHeader);
                    $('<span/>')
                        .addClass('ui-icon ui-icon-minusthick')
                        .appendTo(mWRegionHeaderMinus);
                }
            }
        }
    },

    destroy: function() {
        this._mouseDestroy();
        
        this.element.find('div.mapWidget-overlay').remove();
        this.element.removeClass('mapWidget mapWidget-editing '+this._getData('class'));

        $.widget.prototype.destroy.apply(this, arguments);
    }
}));

$.extend($.ui.mapWidget, {
    version: "0.0.1",
    defaults: $.extend({}, $.ui.mouse.defaults, {
        regions: {},
        'class': '',
        maps: [],
        width: 100,
        height: 100
    })
});

})(jQuery);