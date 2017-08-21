var fs = require('fs');
var path = require('path');
var pdf2img = require('pdf2img');
var tesseract = require('node-tesseract');

var input = path.join(__dirname, 'data', 'input.pdf');

pdf2img.setOptions({
    type: 'png',                                // png or jpg, default jpg 
    size: 2048,                                 // default 1024 
    density: 600,                               // default 600 
    outputdir: path.join(__dirname, 'data'),  // output folder, default null (if null given, then it will create folder name same as file name) 
    outputname: 'input',                         // output file name, dafault null (if null given, then it will create image name same as input name) 
    page: null                                  // convert selected page, default null (if null given, then it will convert all pages) 
});

pdf2img.convert(input, function (err, info) {
    if (err) {
        console.log(err);
        return;
    }

    info.message.map(function (image) {
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