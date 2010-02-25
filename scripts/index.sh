#!/bin/sh
function getzone () {
    echo $(head -n 2 $1 | tail -n 1)
}

function getname () {
    echo $(head -n 3 $1 | tail -n 1)
}

function getrealm () {
    echo $(head -n 5 $1 | tail -n 1)
}

function header () {
    cat << EOHTML
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Zones in SVG</title>
    <style type="text/css" rel="stylesheet">
        .main {
            -moz-column-width:100px;
            -moz-column-gap: 10px;
            -moz-column-rule: 1px solid #dedede;
            -webkit-column-width:100px;
            -webkit-column-gap: 10px;
            -webkit-column-rule: 1px solid #dedede;
        }
        .zoneblock.Alsius {
            border: 1px solid blue;
            background-color: #5555ff;
        }
        .zoneblock.Ignis {
            border: 1px solid red;
            background-color: #ff5555;
        }
        .zoneblock.Syrtis {
            border: 1px solid green;
            background-color: #55ff55;
        }
        .title {
            border-top: 1px solid black;
        }
        .svg > img {
            border: 1px solid lightblue;
        }
    </style>
</head>
<body>
<div class="main">
EOHTML
}

function footer () {
    cat << EOHTML
</div>
</body>
</html>
EOHTML
}

function drawzone () {
    zone=$(getzone $1)
    name=$(getname $1)
    realm=$(getrealm $1)
    file=`basename $1 .poly`
    cat << EOHTML
<div class="zoneblock ${realm}">
    <div class="svg"><a href="${file}.svg"><img src="${file}.svg" width="100" height="100"/></a></div>
    <div class="title">$name ($zone)</div>
</div>
EOHTML
}

header > index.xhtml
for poly in `ls -1cr *.poly`; do
    drawzone $poly >> index.xhtml
done
footer >> index.xhtml

