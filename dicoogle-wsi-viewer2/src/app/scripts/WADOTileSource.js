var jQuery = require('jquery');

(function ($) {

    //Search Patterns for \r\n and --frame--
    var start_pattern = {pattern: [13, 10, 13, 10], lsp: kmpTable([13, 10, 13, 10])};
    var end_pattern = {pattern: [45, 45, 102, 114, 97, 109, 101, 45, 45], lsp: kmpTable([45, 45, 102, 114, 97, 109, 101, 45, 45])};
    var include_fields = ["TotalPixelMatrixColumns", "TotalPixelMatrixRows", "NumberOfFrames","Rows","Columns","ImageType","SharedFunctionalGroupsSequence.PixelMeasuresSequence.PixelSpacing"];
    
    //KMP Algorithm for searching patterns directly in the response byte array.
    // Adapted from: 
    // Copyright (c) 2014 Project Nayuki
    // https://www.nayuki.io/page/knuth-morris-pratt-string-matching

    //Function to pre-compute prefix table.
    function kmpTable(pattern){
        var lsp = [0];  // Base case
        for (var i = 1; i < pattern.length; i++) {
            var j = lsp[i - 1];  // Start by assuming we're extending the previous LSP
            while (j > 0 && pattern[i] != pattern[j])
                j = lsp[j - 1];
            if (pattern[i] == pattern[j])
                j++;
            lsp.push(j);
        }
        return lsp;
    }

    //KMP searching function. 
    function kmpSearch(pattern, text, lsp) {
        if (pattern.length == 0)
            return 0;  // Immediate match

        // Compute longest suffix-prefix table
        if(!lsp){
            var lsp = [0];  // Base case
            for (var i = 1; i < pattern.length; i++) {
                var j = lsp[i - 1];  // Start by assuming we're extending the previous LSP
                while (j > 0 && pattern[i] != pattern[j])
                    j = lsp[j - 1];
                if (pattern[i] == pattern[j])
                    j++;
                lsp.push(j);
            }
        }

        // Walk through text string
        var j = 0;  // Number of chars matched in pattern
        for (var i = 0; i < text.length; i++) {
            while (j > 0 && text[i] != pattern[j])
                j = lsp[j - 1];  // Fall back in the pattern
            if (text[i] == pattern[j]) {
                j++;  // Next char matched, increment position
                if (j == pattern.length)
                    return i - (j - 1);
            }
        }
        return -1;  // Not found
    }

    // private class
    function WADOImageJob(options) {

        $.extend(true, this, {
            timeout: $.DEFAULT_SETTINGS.timeout,
            jobId: null
        }, options);

        /**
         * Image object which will contain downloaded image.
         * @member {Image} image
         * @memberof OpenSeadragon.ImageJob#
         */
        this.image = null;
    }

    WADOImageJob.prototype = {
        errorMsg: null,
        start: function () {
            var _this = this;

            this.image = new Image();

            if (this.crossOriginPolicy !== false) {
                this.image.crossOrigin = this.crossOriginPolicy;
            }

            this.image.onload = function () {
                _this.finish(true);
            };
            this.image.onabort = this.image.onerror = function () {
                _this.errorMsg = "Image load aborted";
                _this.finish(false);
            };

            this.jobId = window.setTimeout(function () {
                _this.errorMsg = "Image load exceeded timeout";
                _this.finish(false);
            }, this.timeout);

            var xhr = new XMLHttpRequest();
            xhr.open("GET", this.src, true);
            xhr.setRequestHeader("Accept", "multipart/related; type=image/dicom+jpeg; transfer-syntax=1.2.840.10008.1.2.4.70");
            xhr.responseType = "arraybuffer";

            // For debug porposes    
            // xhr.onreadystatechange = function () {
            //     if (this.readyState == this.HEADERS_RECEIVED) {
            //         //console.log(xhr.getResponseHeader("Content-Type"));
            //     }
            // }

            // xhr.onerror = function () {
            //     //console.log("** An error occurred during the transaction");
            // };

            xhr.onload = function () {
                var arrayBufferView = new Uint8Array(xhr.response);
                
                var i = kmpSearch(start_pattern.pattern, arrayBufferView, start_pattern.lsp) + 4;
                var z = kmpSearch(end_pattern.pattern, arrayBufferView, end_pattern.lsp);

                var arr = arrayBufferView.subarray(i, z);
                //console.log(arr.length);
                //console.log(arr);

                objectURL = window.URL.createObjectURL(new Blob([arr], { type: "image/jpeg" }));
                //console.log(objectURL);
                _this.image.src = objectURL;
            }            

            xhr.send();            
        },

        finish: function (successful) {
            this.image.onload = this.image.onerror = this.image.onabort = null;
            if (!successful) {
                this.image = null;
            }

            if (this.jobId) {
                window.clearTimeout(this.jobId);
            }

            this.callback(this);
        }

    };

    $.ImageLoader.prototype.addJob = function( options ) {
            var _this = this,
                complete = function( job ) {
                    completeJob( _this, job, options.callback );
                },
                jobOptions = {
                    src: options.src,
                    crossOriginPolicy: options.crossOriginPolicy,
                    callback: complete,
                    abort: options.abort
                },
                newJob = new WADOImageJob( jobOptions );

            if ( !this.jobLimit || this.jobsInProgress < this.jobLimit ) {
                newJob.start();
                this.jobsInProgress++;
            }
            else {
                this.jobQueue.push( newJob );
            }
    }

    function completeJob(loader, job, callback) {
        var nextJob;

        loader.jobsInProgress--;

        if ((!loader.jobLimit || loader.jobsInProgress < loader.jobLimit) && loader.jobQueue.length > 0) {
            nextJob = loader.jobQueue.shift();
            nextJob.start();
            loader.jobsInProgress++;
        }

        callback(job.image, job.errorMsg);
    }

    $.WADOTileSource = function (StudyInstanceUID,SeriesInstanceUID) {
        /*
         "height": data.columns,
         "width": data.rows,
         "tileWidth": 512,
         "tileHeight": 512,
         "minLevel": 1,
         "maxLevel": 5,
         */

        //_this.metadata;
        //_this.level_data = ;

        this.SeriesInstanceUID = SeriesInstanceUID;
        this.StudyInstanceUID = StudyInstanceUID;
    };

    $.WADOTileSource.prototype.hasPyramidInformation = function () {
        return this.metadata !== undefined && this.level_data !== undefined;
    };

    $.WADOTileSource.prototype.requestPyramidInformationOLD = function () {
        var _this = this;
        jQuery.ajax({
            url: (__DEV__) ? "http://demo.dicoogle.com/tmg/dwsp/pinfo" : "pinfo", //SOLVED IN COMPILE TIME
            data: {SeriesInstanceUID: _this.SeriesInstanceUID},
            async: false,
            success: function (data, status) {
                //console.log(data);
                //console.log(status);

                _this.metadata = data;

                var minLevel = 0;
                var maxLevel = data.subresolution_images.length;
                var args = {
                    width: data.width,
                    height: data.height,
                    tileWidth: data.tile_width,
                    tileHeight: data.tile_height,
                    minLevel: minLevel,
                    maxLevel: maxLevel
                };

                _this.width = data.width;
                _this.height = data.height;
                _this.resolution = data.resolution;
                _this.level_data = [];

                for (var i = minLevel; i < maxLevel; i++) {
                    _this.level_data[i] = data.subresolution_images[data.subresolution_images.length - i - 1];

                    //SET THE LEVEL SCALE
                    _this.level_data[i].scale = _this.level_data[i].width / data.width;

                }
                _this.level_data[maxLevel] = data;
                _this.level_data[maxLevel].scale = 1;

                $.TileSource.apply(_this, [args]);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
                /*jQuery("#viewermain").remove();
                jQuery("#error_message").append("Error requesting metadata from image.");
                jQuery("#error").css("display", "block");*/
            }
        });

        return _this.hasPyramidInformation();
    };

    $.WADOTileSource.prototype.requestPyramidInformation = function () {
        var _this = this;
        jQuery.ajax({
            url: (__DEV__) ? "http://demo.dicoogle.com/dicom/qido-rs/studies/"+_this.StudyInstanceUID+"/series/"+_this.SeriesInstanceUID+"/instances" : window.location.origin + "/dicom/qido-rs/studies/"+_this.StudyInstanceUID+"/series/"+_this.SeriesInstanceUID+"/instances", //SOLVED IN COMPILE TIME
            headers: { Accept: "application/json" },
            data: jQuery.param({includefield: include_fields}, true),
            async: false,
            success: function (data, status) {
                //console.log(data);
                //console.log(status);

                _this.metadata = _this.buildImagePyramidMetadata(data);

                //console.log(_this.metadata);                

                var minLevel = 0;
                var maxLevel = _this.metadata.subresolution_images.length;
                var args = {
                    width: _this.metadata.width,
                    height: _this.metadata.height,
                    tileWidth: _this.metadata.tile_width,
                    tileHeight: _this.metadata.tile_height,
                    minLevel: minLevel,
                    maxLevel: maxLevel
                };

                _this.width = _this.metadata.width;
                _this.height = _this.metadata.height;
                _this.resolution = _this.metadata.resolution;
                _this.level_data = [];

                for (var i = minLevel; i < maxLevel; i++) {
                    _this.level_data[i] = _this.metadata.subresolution_images[_this.metadata.subresolution_images.length - i - 1];

                    //SET THE LEVEL SCALE
                    _this.level_data[i].scale = _this.level_data[i].width / _this.metadata.width;

                }
                _this.level_data[maxLevel] = _this.metadata;
                _this.level_data[maxLevel].scale = 1;

                $.TileSource.apply(_this, [args]);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
                /*jQuery("#viewermain").remove();
                jQuery("#error_message").append("Error requesting metadata from image.");
                jQuery("#error").css("display", "block");*/
            }
        });

        return _this.hasPyramidInformation();
    };

    $.WADOTileSource.prototype.buildImagePyramidMetadata = function (qido_response) {
        var base;
        var subresolution_images = [];
        var i, current_instance;
        for (i = 0; i < qido_response.length; i++) {
            current_instance = new $.WADOTileSource.WSIPyramidDescriptor(qido_response[i]);

            if (current_instance.isOriginalImage())
                base = current_instance;
            else if (current_instance.isSubResolutionImage())
                subresolution_images.push(current_instance);

        }

        subresolution_images.sort(function compare(a, b) {
            return b.nframes - a.nframes;
        });

        var ret = { 
                SOPInstanceUID: base.SOPInstanceUID,

                width: base.total_columns,
                height: base.total_rows,

                tile_width: base.tile_width,
                tile_height: base.tile_height,

                ntiles: base.nframes,

                resolution: base.resolution,

                subresolution_images: []
             };

        for(i = 0 ; i < subresolution_images.length ; i++){
            current_instance = subresolution_images[i];
            ret.subresolution_images.push({
                SOPInstanceUID: current_instance.SOPInstanceUID,

                width: current_instance.total_columns,
                height: current_instance.total_rows,

                tile_width: current_instance.tile_width,
                tile_height: current_instance.tile_height,

                ntiles: current_instance.nframes,
            });
        }

		return ret; 
    };

    $.extend(true, $.WADOTileSource.prototype, $.TileSource.prototype);

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
    $.WADOTileSource.prototype.getTileUrl = function (level, x, y) {
        var _this = this;

        if (level < _this.minLevel || level > _this.maxLevel)
            throw new Error("Level not found exception: " + level);

        var image_meta = _this.level_data[level];

        var sop = image_meta.SOPInstanceUID;
        var nx_tiles = Math.ceil(image_meta.width / image_meta.tile_width);
        var ny_tiles = Math.ceil(image_meta.height / image_meta.tile_height);

        if (x > nx_tiles || y > ny_tiles) {
            throw new Error("Reuested Tile does not fit image bounds: " + x + " " + y);
        }

        var frame = y * nx_tiles + x;

        if (frame > image_meta.ntiles) {
            throw new Error("The requested frame is not present in the image: " + frame);
        }

        if(__DEV__){
            var url = "http://demo.dicoogle.com/dicom/wado-rs/studies/0.0.0.0/series/1.0.1.0/instances/" + sop + "/frames/" + frame;   
        }else{
            var url =  window.location.origin + "/dicom/wado-rs/studies/0.0.0.0/series/1.0.1.0/instances/" + sop + "/frames/" + frame;
        }

        return url;
    };

    /**
     * WSI Pyramid Descriptor class
     */

    $.WADOTileSource.WSIPyramidDescriptor = function (dicom_json_metadata) {
        //console.log(dicom_json_metadata);
        
        this.total_columns = dicom_json_metadata["00480006"].Value[0];
        this.total_rows = dicom_json_metadata["00480007"].Value[0];

        this.tile_width = dicom_json_metadata["00280011"].Value[0];
        this.tile_height = dicom_json_metadata["00280010"].Value[0];

        this.SOPInstanceUID = dicom_json_metadata["00080018"].Value[0];

        this.nframes = dicom_json_metadata["00280008"].Value[0];
        this.image_type = dicom_json_metadata["00080008"].Value;

        if (this.image_type[2] == "VOLUME") {
            this.isImage = true;
            this.isResampled = (this.image_type[3] == "RESAMPLED");

            this.resolution = dicom_json_metadata["52009229"].Value[0]["00289110"].Value[0]["00280030"].Value[0];
        } else {
            this.isImage = false;
            this.isResampled = false;
        }

    };

    $.WADOTileSource.WSIPyramidDescriptor.prototype.isSubResolutionImage = function () {
        return this.isImage && this.isResampled;
    };

    $.WADOTileSource.WSIPyramidDescriptor.prototype.isOriginalImage = function() {
        return this.isImage && !this.isResampled;
    };

}(OpenSeadragon));