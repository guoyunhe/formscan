var fs = require('fs');
var path = require('path');
var gm = require('gm');
var getColors = require('get-image-colors');
var getPixels = require("get-pixels");
var pdf2img = require('pdf2img');
var tesseract = require('node-tesseract');
var _ = require('lodash');

var structure = JSON.parse(fs.readFileSync(path.join(__dirname, 'structure.json'), 'utf8'));

var input = path.join(__dirname, 'data', 'input.pdf');

pdf2img.setOptions({
    type: 'png',                                // png or jpg, default jpg 
    size: 2048,                                 // default 1024 
    density: 600,                               // default 600 
    outputdir: path.join(__dirname, 'data', 'pages'),    // output folder, default null (if null given, then it will create folder name same as file name) 
    outputname: 'page',                   // output file name, dafault null (if null given, then it will create image name same as input name) 
    page: null                                  // convert selected page, default null (if null given, then it will convert all pages) 
});

pdf2img.convert(input, function (err, info) {
    if (err) {
        console.log(err);
        return;
    }

    info.message.map(function (image, i) {
        gm(image.path).size(function (err, size) {
            if (structure[i]) {
                structure[i].map(function (area, j) {
                    let outputPath = path.join(__dirname, 'data', 'pages', 'area_' + i + '_' + j + '.png');
                    gm(image.path).crop(
                        size.width * (area.boundary.right - area.boundary.left),
                        size.height * (area.boundary.bottom - area.boundary.top),
                        size.width * area.boundary.left,
                        size.height * area.boundary.top
                    ).write(outputPath, function (err) {
                        if (err) {
                            console.log(err);
                            return;
                        }

                        if (area.type === 'text') {
                            tesseract.process(outputPath, { l: 'fin' }, function (err, text) {
                                if (err) {
                                    console.error(err);
                                    return;
                                }

                                console.log(area.name + ': ' + text);
                            });
                        } else if (area.type === 'checkbox') {
                            getPixels(outputPath, function (err, pixels) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                const mean = _.mean(pixels.data);
                                if (mean < 250) {
                                    console.log(area.name + ': ' + area.value);
                                }
                            });
                        }
                    });
                });
            }
        });

        tesseract.process(image.path, { l: 'fin' }, function (err, text) {
            if (err) {
                console.error(err);
                return;
            }

            fs.writeFile(image.path + '.txt', text, function (err) {
                if (err) {
                    return console.log(err);
                }
            });
        });
    });
});