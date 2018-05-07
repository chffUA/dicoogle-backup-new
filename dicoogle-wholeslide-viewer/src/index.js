var jQuery = require('jquery');
require('./openseadragon');
require('./openseadragon-scalebar');

(function($) {

    $.WADOTileSource = function (SeriesInstanceUID) {
        /*
            "height": data.columns,
            "width": data.rows,
            "tileWidth": 512,
            "tileHeight": 512,
            "minLevel": 1,
            "maxLevel": 5,
        */
        _this = this;

        //_this.metadata;
        //_this.level_data = ;

        _this.SeriesInstanceUID = SeriesInstanceUID;

    };

    $.WADOTileSource.prototype.hasPyramidInformation = function(){
        return _this.metadata !== undefined && _this.level_data !== undefined;      
    };    

    $.WADOTileSource.prototype.requestPyramidInformation = function(){
            jQuery.ajax({
                url: "pinfo",
                data: {SeriesInstanceUID: _this.SeriesInstanceUID},
                async: false,
                success: function (data, status) {
                    //console.log(data);
                    //console.log(status);

                    _this.metadata = data;

                    var minLevel = 0;
                    var maxLevel = data.subresolution_images.length;
                    var args = { width: data.width, height: data.height, tileWidth: data.tile_width, tileHeight: data.tile_height, minLevel: minLevel, maxLevel: maxLevel};
                    
                    _this.resolution = data.resolution;
                    _this.level_data = [];
                    
                    for (var i = minLevel; i < maxLevel; i++) {
                        _this.level_data[i] = data.subresolution_images[data.subresolution_images.length-i-1];

                        //SET THE LEVEL SCALE
                        _this.level_data[i].scale = _this.level_data[i].width / data.width;     
                                                        
                    }                    
                    _this.level_data[maxLevel] = data;
                    _this.level_data[maxLevel].scale = 1;

                    $.TileSource.apply(_this, [args]);               
                },
                error: function(jqXHR, textStatus, errorThrown){
                    console.log(errorThrown);
                    
                    document.getElementById('viewermain').innerHTML =
                    "<div id=\"error\" class=\"error\">\n\
                    <img class=\"displayed\"src=\"images/warning.png\" style=\"width:100px;height:100px;vertical-align=middle;\">\n\
                    <br> Error requesting metadata from image.</div>";
                }   
        });

        return _this.hasPyramidInformation();
    };

    $.extend( true, $.WADOTileSource.prototype, $.TileSource.prototype );

    /**
     * Responsible for retriving the url which will return an image for the
     * region specified by the given x, y, and level components.
     * This method is not implemented by this class other than to throw an Error
     * announcing you have to implement it.  Because of the variety of tile
     * server technologies, and various specifications for building image
     * pyramids, this method is here to allow easy integration.
     * @function
     * @param {Number} level
     * @param {Number} x
     * @param {Number} y
     * @throws {Error}
     */
    $.WADOTileSource.prototype.getTileUrl = function( level, x, y ) {
        if(level < _this.minLevel || level > _this.maxLevel)
            throw new Error("Level not found exception: "+level);

        var image_meta = _this.level_data[level];

        var sop = image_meta.SOPInstanceUID;
        var nx_tiles = Math.ceil( image_meta.width / image_meta.tile_width );
        var ny_tiles = Math.ceil( image_meta.height / image_meta.tile_height );
        
        if( x > nx_tiles || y > ny_tiles){
            throw new Error("Reuested Tile does not fit image bounds: "+x+" "+y);
        }

        var frame = y*nx_tiles + x;

        if( frame > image_meta.ntiles ){
            throw new Error("The requested frame is not present in the image: "+frame);
        }

        var url = window.location.origin+"/ext/instance/"+sop+"/frame/"+frame+"?TS=1.2.840.10008.1.2.4.50&fwsi=true";

        return url;        
    };    
}(OpenSeadragon));

var get_params = function (search_string) {

    var parse = function (params, pairs) {
        var pair = pairs[0];
        var parts = pair.split('=');
        var key = decodeURIComponent(parts[0]);
        var value = decodeURIComponent(parts.slice(1).join('='));
        // Handle multiple parameters of the same name
        if (typeof params[key] === "undefined") {
            params[key] = value;
        } else {
            params[key] = [].concat(params[key], value);
        }

        return pairs.length === 1 ? params : parse(params, pairs.slice(1));
    };
    // Get rid of leading ?
    return search_string.length === 0 ? {} : parse({}, search_string.substr(1).split('&'));
};

jQuery(document).ready(function () {
    var params = get_params(window.location.search);
    var siuid = params['siuid'];
    
    //var siuid = "SeriesInstanceUID";
    
    var wado_source = new OpenSeadragon.WADOTileSource(siuid);

    var success = wado_source.requestPyramidInformation();

    //console.log(wado_source);
    
    if (success) {
        OpenSeadragon.setString("Tooltips.Home","Return to start zoom");

        var viewer = OpenSeadragon({
            id: "viewermain",
            prefixUrl: "images/",
            showNavigator: true,
            tileSources: wado_source,

            showRotationControl: true,
            showFullPageControl: false
        });
        
        
        viewer.addHandler("til  e-load-failed", function (event) {
            if (event.message === "Image load aborted") {
                viewer.destroy();
                document.getElementById('viewermain').innerHTML =
                        "<div id=\"error\" class=\"error\">\n\
		    <img class=\"displayed\"src=\"images/warning.png\" style=\"width:100px;height:100px;vertical-align=middle;\">\n\
		    <br> Error loading image</div>";
            }
        });
        
        if (_this.resolution) {
            viewer.scalebar({
                xOffset: 5,
                yOffset: 10,
                barThickness: 3,
                color: '#555555',
                fontColor: '#333333',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                pixelsPerMeter: _this.resolution
            });
        }
    } else {
        document.getElementById('viewermain').innerHTML =
                "<div id=\"error\" class=\"error\">\n\
                    <img class=\"displayed\"src=\"images/warning.png\" style=\"width:100px;height:100px;vertical-align=middle;\">\n\
                    <br> Error requesting metadata from image.\
                    <br> Instance " + siuid + " not found.</div>";
    }

/*    var params = get_params(window.location.search);
    var uri = params['uri'];
    var sop = params['sop'];
    if (uri) {
        var data = {'uri': uri};
    } else {
        var data = {'sop': sop};
    }

    $.ajax({
        url: "info",
        data: data,
        success: function (data, status) {
            console.log(data);
            console.log(status);
            var params = get_params(location.search);
            // Finally, to get the param you want
            var image_name = data.image_name;
            var viewer = OpenSeadragon({
                id: "viewermain",
                prefixUrl: "images/",
                showNavigator: true,
                tileSources: {
                    "height": data.columns,
                    "width": data.rows,
                    "tileWidth": 512,
                    "tileHeight": 512,
                    "minLevel": 1,
                    "maxLevel": 5,
                    "getTileUrl": function (level, x, y) {

                        var temp_sop = "1.2.276.0.7230010.3.1.4.3252829876.6808.1426168008.536.1"; // + ".1".repeat(level);
                        sop = temp_sop;
                        //return "file:///images/" + (y * data.columns + x) + ".jpg";
                        console.log("asking level " + level + ",(" + x + "," + y + ")");
                        console.log(sop + "/frame/" + (y * data.columns / 512 + x) + "?width=800&height=800&TS=1.2.840.10008.1.2.1");

                        return "http://biodatacenter.ieeta.pt:6925/ext/instance/" + sop + "/frame/" + (y * (data.columns / 512) + x) + "?width=800&height=800&TS=1.2.840.10008.1.2.1";
                        //(level - 8) + "-r" + y + "-c" + x + ".jpg";
                    }



                }
            });
            viewer.addHandler("til  e-load-failed", function (event) {
                if (event.message === "Image load aborted") {
                    viewer.destroy();
                    document.getElementById('viewermain').innerHTML =
                            "<div id=\"error\" class=\"error\">\n\
		    <img class=\"displayed\"src=\"images/warning.png\" style=\"width:100px;height:100px;vertical-align=middle;\">\n\
		    <br> Error loading image</div>";
                }
            });
            if (data.resolution) {
                viewer.scalebar({
                    xOffset: 5,
                    yOffset: 10,
                    barThickness: 3,
                    color: '#555555',
                    fontColor: '#333333',
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    pixelsPerMeter: data.resolution
                });
            }
        },
        error: function (request, status, error) {
            document.getElementById('viewermain').innerHTML =
                    "<div id=\"error\" class=\"error\">\n\
                    <img class=\"displayed\"src=\"images/warning.png\" style=\"width:100px;height:100px;vertical-align=middle;\">\n\
                    <br> Error loading image</div>";
        }
    });*/
});


