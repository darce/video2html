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

const generateDivsFromFrame = async (imagePath) => {
    const image = await jimp.read(imagePath)

    /** Resize and maintain aspect ratio */
    image.resize(100, jimp.AUTO)
    const { width, height } = image.bitmap

    let htmlContent = `<!DOCTYPE html><html><head>
        <link rel="stylesheet" href="./hexColor.css">
        <style>
        .frame-pixel {
            /* Ensure 3D transformations work */
            transform-style: preserve-3d;
            transition: transform 0.6s;
        }
        
        .frame-pixel:hover {
            transform: rotateX(45deg) rotateY(45deg) rotateZ(45deg);
        }
    </style>
        </head><body>`
    htmlContent += '<div class="frame-container">'

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const hexColor = image.getPixelColor(x, y)
            const rgba = jimp.intToRGBA(hexColor)

            /** Build div for this pixel */
            const pixelDiv = `
                <div class="frame-pixel" style="
                background-color:rgba(
                    ${rgba.r},
                    ${rgba.g},
                    ${rgba.b},
                    ${rgba.a / 255}
                )"></div>`
            htmlContent += pixelDiv
        }
    }
    htmlContent += `</div>
    <script src="hexColorBehavior.js">
    </body></html>`
    return htmlContent
}

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

        const htmlContent = await generateDivsFromFrame(imagePath)
        fs.writeFileSync('./hexColor.html', htmlContent)
    })
