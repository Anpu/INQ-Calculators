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
        if (!points || !points.length) return;
        var p = points[0] instanceof Point
                    ? points[0]
                    : new Point(points[0][0], points[0][1]);
        this.points = [p];

        var l=p.x, t=p.y, r=p.x, b=p.y;

        for (var i=1, len=points.length; i<len; i++) {
            p = points[i] instanceof Point
                    ? points[i]
                    : new Point(points[i][0], points[i][1]);
            l = Math.min(l,p.x);
            r = Math.max(r,p.x);
            t = Math.min(t,p.y);
            b = Math.max(b,p.y);
            this.points.push(p);
        }
        this.bounds = new Rect(l,t,r,b);
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
