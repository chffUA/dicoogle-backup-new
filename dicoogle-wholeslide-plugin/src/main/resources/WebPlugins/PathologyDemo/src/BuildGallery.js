var $ = require('jquery')
var wado_driver = require('wado-ts-library')

module.exports = {
    buildGallery: function (div, uniqueSeries) {
        var containers = {};

        var divTitle = document.createElement('div');
        divTitle.setAttribute('class', 'col-lg-12');

        var header = document.createElement('h1');
        header.setAttribute('class', 'page-header');
        header.innerHTML = "Digital Pathology Images";

        divTitle.appendChild(header); // appends header to div header container
        div.appendChild(divTitle); // appends title to gallery row

        var ulPagination = document.createElement('ul');
        ulPagination.setAttribute('class', 'nav nav-tabs nav-stacked');
        ulPagination.setAttribute('id', 'ulPagination');

        // building gallery items
        uniqueSeries.forEach(function (value, key, map) {
            var liPagination = document.createElement('li');

            var divImage = document.createElement('div');
            divImage.setAttribute('id', 'container');
            divImage.setAttribute('class', 'col-lg-4 col-md-6 col-xs-6');
            divImage.setAttribute('style', 'margin-bottom: 30px;');

            var a = document.createElement('a');
            a.setAttribute('class', 'thumbnail');
            a.setAttribute('style', 'text-decoration: none;');
            a.setAttribute('href', "/tmg/dwsp?seriesuid=" + value["SeriesInstanceUID"] + "&studyuid=" + value["StudyInstanceUID"]);
            a.setAttribute('target', '_blank');

            var divCaption = document.createElement('div');
            divCaption.setAttribute('class', 'caption');
            divCaption.setAttribute("id", 'caption_' + value["SeriesInstanceUID"]);
            var pPN = document.createElement('p');
            pPN.innerHTML = "Patient Name: ".bold() + value["PatientName"];
            var pDate = document.createElement('p');
            pDate.innerHTML = "Date: ".bold() + value["StudyDate"].substring(0, 4) + "-" + value["StudyDate"].substring(4, 6) + "-" + value["StudyDate"].substring(6, 8);


            divCaption.appendChild(pPN);
            divCaption.appendChild(pDate);

            var divCanvas = document.createElement('div');
            containers[value["SeriesInstanceUID"]] = divCanvas;

            a.appendChild(divCanvas);
            a.appendChild(divCaption);
            divImage.appendChild(a);
            liPagination.appendChild(divImage);
            ulPagination.appendChild(liPagination);
        });

        div.appendChild(ulPagination);

        var divButtonsPagination = document.createElement('div');
        divButtonsPagination.setAttribute('class', 'pagination pagination-large');
        var ulButtonPagination = document.createElement('ul');
        ulButtonPagination.setAttribute('class', 'pager');

        divButtonsPagination.appendChild(ulButtonPagination);
        div.appendChild(divButtonsPagination);


        var listElement = ulPagination;
        var perPage = 3;
        var numItems = listElement.children.length;
        var numPages = Math.ceil(numItems / perPage);
        var aStyle = "cursor: pointer; -webkit-user-select: none; -moz-user-select: none; user-select: none;";

        ulButtonPagination.setAttribute("curr", 1);

        var liPrevious = document.createElement('li');
        var aPrevious = document.createElement('a');
        aPrevious.setAttribute('style', aStyle);
        aPrevious.innerHTML = "&laquo;";
        liPrevious.appendChild(aPrevious);
        liPrevious.onclick = (function () {
            return function () {
                previous();
            }
        })();
        ulButtonPagination.appendChild(liPrevious);

        var curr = 0;
        while (numPages > curr) {
            var liPage = document.createElement('li');
            var aPage = document.createElement('a');
            aPage.setAttribute('class', 'page_link');
            aPage.setAttribute('id', 'page' + (curr + 1));
            aPage.setAttribute('style', aStyle);
            aPage.innerHTML = (curr + 1);
            liPage.appendChild(aPage);
            ulButtonPagination.appendChild(liPage);
            curr++;
        }

        var liNext = document.createElement('li');
        var aNext = document.createElement('a');
        aNext.setAttribute('style', aStyle);
        aNext.innerHTML = "&raquo;";
        liNext.appendChild(aNext);
        liNext.onclick = (function () {
            return function () {
                next();
            }
        })();
        ulButtonPagination.appendChild(liNext);

        $('.pager .page_link:first').addClass('active');

        for (var i = 0; i < numItems; i++) {
            if (i < perPage) {
                listElement.children.item(i).setAttribute('style', 'display:block');
            } else {
                listElement.children.item(i).setAttribute('style', 'display:none');
            }
        }

        for (var i = 1; i < ulButtonPagination.children.length - 1; i++) {
            ulButtonPagination.children.item(i).onclick = (function () {
                var clickedPage = i;
                return function () {
                    goTo(clickedPage, perPage);
                }
            })();
        }

        function previous() {
            var goToPage = parseInt(ulButtonPagination.getAttribute("curr")) - 1;
            if (goToPage < 1) {
                return;
            }
            goTo(goToPage);
        }

        function next() {
            var goToPage = parseInt(ulButtonPagination.getAttribute("curr")) + 1;
            if (goToPage > numPages) {
                return;
            }
            goTo(goToPage);
        }

        function goTo(page) {
            var startAt = page * perPage - perPage,
                endOn = startAt + perPage;

            if (endOn > numItems) {
                endOn = numItems;
            }

            for (var i = 0; i < numItems; i++) {
                listElement.children.item(i).setAttribute('style', 'display:none');
                if (i >= startAt && i < endOn) {
                    listElement.children.item(i).setAttribute('style', 'display:block');
                }
            }

            ulButtonPagination.setAttribute("curr", page);
        }

        var divHelp = document.createElement('div');
        divHelp.setAttribute('class', 'col-lg-12');
        divHelp.setAttribute('style', 'text-align: right;');
        divHelp.innerHTML = '<small>For more information please contact: tmgodinho@ua.pt or ruilebre@ua.pt</small>';
        div.appendChild(divHelp);


        return containers;
    }
}