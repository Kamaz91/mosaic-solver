var Jimp = require('jimp');
var fs = require('fs');

Data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
var rawScheme = Data.rawScheme;
var outputScheme = Data.outputScheme;
var imageParts = {};

fs.readdirSync(Data.rawDir).forEach(rawimage => {
    var queue = [];
    console.log("Processing: " + rawimage);
    var image = Jimp.read(Data.rawDir + rawimage);
    for (let i in rawScheme) {
        console.log("queuing task:" + i);
        queue[i] = crop(image, rawimage, rawScheme, i);
    }
    Promise.all(queue).then((response) => {
        console.log("Starting composing image");
        new Jimp(Data.outputSize.width, Data.outputSize.height, (err, image) => {
            if (err) throw err;
            for (var i in response) {
                var part = response[i].data.part;
                var filename = response[i].data.filename;
                var croppedPart = response[i].image;
                console.log(`Processing ${filename} part:${part}`);
                image.blit(croppedPart, outputScheme[part].x, outputScheme[part].y);
            }
            image.write(Data.outputDir + filename); // save
        });

    });
});

function crop(imgPromise, filename, rawScheme, i) {
    return imgPromise.then((image) => {
        console.log(filename + " part " + i + " cropped");
        var clone = image.clone();
        var crop = clone.crop(rawScheme[i].x, rawScheme[i].y, rawScheme[i].width, rawScheme[i].height);
        //clone.write(Data.outputDir + "part" + i + "-" + filename); // save
        return {
            image: crop,
            data: {
                filename: filename,
                part: i
            }
        }
    })
}