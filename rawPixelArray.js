const fs = require('fs')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const jimp = require('jimp')

if (!fs.existsSync('stills')) {
    fs.mkdirSync('stills')
}

if (!fs.existsSync('pixels')) {
    fs.mkdirSync('pixels')
}

const videoPath = process.argv[2]
if (!videoPath) {
    console.error('No video file')
    process.exit(1)
}

const videoFileName = path.basename(videoPath, path.extname(videoPath))

/** Extract frames with ffmpeg,
 * extract raw pixel data with jimp
*/
ffmpeg(videoPath)
    .on('end', () => console.log('Finished frame extraction'))
    .on('error', (error) => console.error('Error:', error))
    .takeFrames(1) // Start with one frame for proof of concept
    .save(path.join(__dirname, 'stills', `${videoFileName}-%03d.png`))
    .on('end', async () => {
        const imagePath = path.join(__dirname, 'stills', `${videoFileName}-001.png`)// Adjust with takeFrames(1)
        const image = await jimp.read(imagePath)
        const pixelArray = []

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const red = image.bitmap.data[idx + 0]
            const green = image.bitmap.data[idx + 1]
            const blue = image.bitmap.data[idx + 2]
            pixelArray.push([red, green, blue])
        })

        const pixelDataPath = path.join(__dirname, 'pixels', `${videoFileName}.json`)
        fs.writeFileSync(pixelDataPath, JSON.stringify(pixelArray))
        console.log('Pixel array saved')
    })