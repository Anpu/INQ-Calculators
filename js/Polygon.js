/*
 * Generously borrowed and rewritten from http://dawsdesign.com/drupal/google_maps_point_in_polygon
 */

(function($) {

function Point(x, y)
{
    this.x = x;
    this.y = y;
}

$.extend(Point.prototype, {
    toString: function() {
        return '[x='+this.x+',y='+this.y+']';
    },
    css: function() {
        return this.x+'px '+this.y+'px';
    }
});

window.Point = Point;

function Rect(l,t,r,b)
{
    this.l = l;
    this.t = t;
    this.r = r;
    this.b = b;
}

$.extend(Rect.prototype, {
    extendByPoint: function(point)
    {
        this.l = Math.min(this.l,point.x);
        this.r = Math.max(this.r,point.x);
        this.t = Math.min(this.t,point.y);
        this.b = Math.max(this.b,point.y);
    },
    containsPoint: function(point)
    {
        return (point.x >= this.l && point.x <= this.r
            && point.y >= this.t && point.y <= this.b);
    }
});

window.Rect = Rect;

/**
 * points is an array of 2 member x,y arrays
 */
function Polygon(points)
{
   this.setPoints(points);
}

$.extend(Polygon.prototype, {
    /**
     * points is an array of 2 member x,y arrays
     */
    setPoints: function(points)
    {
        this.points = [];
        this.bounds = null;
        if (!points || !points.length) {
            return;
        }
        this.addPoint(points[0]);

        for (var i=1, len=points.length; i<len; i++) {
            this.addPoint(points[i]);
        }
    },
    addPoint: function(point)
    {
        var p = point instanceof Point
                    ? point
                    : new Point(point[0], point[1]);
        this.points.push(p);
        if (this.points.length == 1) {
            this.bounds = new Rect(p.x,p.y,p.x,p.y);
        } else {
            this.bounds.extendByPoint(p);
        }
    },
    getBounds: function()
    {
        return this.bounds;
    },
    getPointCount: function()
    {
        return this.points.length;
    },
    getPoint: function(index)
    {
        return this.points[index];
    },
    toArray: function(round)
    {
        var ret = [];
        for (var i=0,l=this.getPointCount(); i<l; i++) {
            var p = this.getPoint(i);
            if (round===undefined) {
                ret.push([p.x,p.y]);
            } else {
                ret.push([parseFloat(p.x.toFixed(round)),parseFloat(p.y.toFixed(round))]);
            }
        }
        return ret;
    },
    clone: function()
    {
        return new Polygon(this.points);
    },
    /**
     * point is a 2 member array of X and Y positions
     */
    containsPoint: function(point) {
        // Do simple calculation so we don't do more CPU-intensive calcs for obvious misses
        if (!this.getBounds().containsPoint(point)) {
            return false;
        }

        var inPoly = false;

        for(var i=0,numPoints = this.getPointCount(),j=numPoints-1;
                i < numPoints;
                j=i,i++) {
            var vertex1 = this.getPoint(i);
            var vertex2 = this.getPoint(j);
            if (vertex1.y < point.y && vertex2.y >= point.y
                    || vertex2.y < point.y && vertex1.y >= point.y)  {
                if (vertex1.x + (point.y - vertex1.y)
                            / (vertex2.y - vertex1.y)
                            * (vertex2.x - vertex1.x) < point.x) {
                    inPoly = !inPoly;
                }
            }
        }

        return inPoly;
    }
});

window.Polygon = Polygon;

})(jQuery);
