/* global Dicoogle */
var $ = require('jquery')
var BuildGallery = require('./BuildGallery')
var wado_driver = require('wado-ts-library')


export default class MyPlugin {

    constructor() {
        // TODO initialize plugin here
    }

    /**
     * @param {DOMElement} parent
     * @param {DOMElement} slot
     */
    render(parent, slot) {
        // TODO mount a new web component here
        const div = document.createElement('div');
        div.setAttribute('class', 'container');

        this.searchPathologyImages(div);

        parent.appendChild(div);
    }

    searchPathologyImages(div) {
        var data = {
            query: "Modality:SM",
            field: ["SOPInstanceUID", "SeriesInstanceUID", "StudyInstanceUID", "PatientName", "StudyDate"],
            keyword: "true"
        };

        var that = this;

        $.ajax({
            url: "search",
            data: data,
            traditional: true,

            success: function (data, status) {
                var uniqueSeries = that.filterInstancesUniqueSeries(data);
                var canvasContainers = BuildGallery.buildGallery(div, uniqueSeries);
                that.findThumbnailTiles(uniqueSeries, canvasContainers);
            },
            dataType: 'json'
        });
    }

    filterInstancesUniqueSeries(instances) {
        var map = new Map();

        for (var i in instances.results) {
            map.set(instances.results[i].fields["SeriesInstanceUID"], instances.results[i].fields);
        }

        return map;
    }

    findThumbnailTiles(uniqueSeries, canvasContainers) {
        var that = this;
        uniqueSeries.forEach(function (value, key, map) {
            $.ajax({
                url: "/tmg/dwsp/pinfo",
                data: { SeriesInstanceUID: value["SeriesInstanceUID"] },
                traditional: true,
                success: function (data, status) {
                    var thumbnailTiles = that.getMin(data.subresolution_images, 'ntiles');

                    var pRes = document.createElement('p');
                    pRes.innerHTML = "Resolution: ".bold() + data.width + 'x' + data.height;
                    document.getElementById('caption_' + value["SeriesInstanceUID"]).appendChild(pRes);

                    that.getTiles(value["StudyInstanceUID"], value["SeriesInstanceUID"], thumbnailTiles.SOPInstanceUID, thumbnailTiles, canvasContainers)
                },
                dataType: 'json'
            });
        });
    }

    getTiles(studyInstanceUID, seriesInstanceUID, sopInstanceUID, thumbnailTiles, canvasContainers) {
        var wado_client = new wado_driver.WADOClient('/dicom/wado-rs');

        wado_client.onerror = function (error) {
            console.log(error);
        }


        const fetchImages = function (urlList) {
            images = [];
            var imgCount = 0;
            var allLoaded = false;
            var images = [];
            var that = this;

            const onImageLoad = function () {
                imgCount += 1;
            }

            const loadImage = function (url) {
                images.push(new Image());
                images[images.length - 1].onload = onImageLoad;
                images[images.length - 1].src = url
            }

            const waitForLoaded = function () {
                if (imgCount === images.length) {
                    canvasContainers[seriesInstanceUID].appendChild(drawCanvas(images));
                    imgCount = 0;
                } else {

                    setTimeout(waitForLoaded, 30); // try again in 100ms
                }
            }

            urlList.forEach((element) => { loadImage(element); });

            setTimeout(waitForLoaded, 30);
        }

        const drawCanvas = function (imageList) {
            var thumbnailCanvas = document.createElement('canvas');
            thumbnailCanvas.width = 250;
            thumbnailCanvas.height = 250;

            var horizontal_tiles = Math.trunc(thumbnailTiles.width / thumbnailTiles.tile_width);
            thumbnailTiles.width % thumbnailTiles.tile_width > 0 ? horizontal_tiles = horizontal_tiles + 1 : horizontal_tiles;
            var height = 0;

            var partialCanvas = document.createElement('canvas');
            partialCanvas.width = thumbnailTiles.width;
            partialCanvas.height = thumbnailTiles.height;
            var ctx_temp = partialCanvas.getContext('2d');

            var imgNumber = 0;
            imageList.forEach(function (image) {
                if (imgNumber >= horizontal_tiles * (height + 1)) {
                    height = height + 1;
                }

                ctx_temp.drawImage(image, (imgNumber % horizontal_tiles) * thumbnailTiles.tile_width, height * thumbnailTiles.tile_height);


                imgNumber += 1;
            });

            var ctx = thumbnailCanvas.getContext('2d');
            ctx.scale(thumbnailCanvas.width / thumbnailTiles.width, thumbnailCanvas.height / thumbnailTiles.height);
            ctx.drawImage(partialCanvas, 0, 0);

            return thumbnailCanvas;
        }

        wado_client.requestFrames(studyInstanceUID, seriesInstanceUID, sopInstanceUID, Array.apply(null, { length: thumbnailTiles.ntiles }).map(Number.call, Number), fetchImages);
    }

    getMin(arr, prop) {
        var min;
        for (var i = 0; i < arr.length; i++) {
            if (!min || parseInt(arr[i][prop]) < parseInt(min[prop]))
                min = arr[i];

            if (arr[i][prop] == 1) {
                break;
            }
        }
        return min;
    }
}