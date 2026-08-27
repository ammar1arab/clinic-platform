const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const inputDir = 'd:/test/clinic-platform/apps/web/public/avatars';

function colorDistance(c1, c2) {
    return Math.sqrt(
        Math.pow(c1[0] - c2[0], 2) +
        Math.pow(c1[1] - c2[1], 2) +
        Math.pow(c1[2] - c2[2], 2)
    );
}

function floodFillRemoveBackground(imgData, startX, startY, tolerance = 15) {
    const width = imgData.width;
    const height = imgData.height;
    const data = imgData.data;
    
    const startIndex = (startY * width + startX) * 4;
    const targetColor = [data[startIndex], data[startIndex+1], data[startIndex+2]];
    
    // If it's already transparent, skip
    if (data[startIndex+3] === 0) return;

    const stack = [[startX, startY]];
    const visited = new Uint8Array(width * height);
    
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const i = y * width + x;
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        if (visited[i]) continue;
        visited[i] = 1;
        
        const idx = i * 4;
        const currentColor = [data[idx], data[idx+1], data[idx+2]];
        
        if (data[idx+3] > 0 && colorDistance(targetColor, currentColor) <= tolerance) {
            // Make transparent
            data[idx+3] = 0; // Alpha = 0
            
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }
}

function getBoundingBox(imgData) {
    const data = imgData.data;
    const width = imgData.width;
    const height = imgData.height;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 10) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    if (minX > maxX) return null;
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function processImages() {
    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.webp'));
    const size = 256;
    
    for (const file of files) {
        console.log(`Processing ${file}...`);
        const imagePath = path.join(inputDir, file);
        
        try {
            const buffer = fs.readFileSync(imagePath);
            const entityImg = await loadImage(buffer);
            
            const tempCanvas = createCanvas(entityImg.width, entityImg.height);
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(entityImg, 0, 0);
            const imgData = tempCtx.getImageData(0, 0, entityImg.width, entityImg.height);
            
            // 1. Remove background using flood fill from all 4 corners
            floodFillRemoveBackground(imgData, 0, 0);
            floodFillRemoveBackground(imgData, entityImg.width - 1, 0);
            floodFillRemoveBackground(imgData, 0, entityImg.height - 1);
            floodFillRemoveBackground(imgData, entityImg.width - 1, entityImg.height - 1);
            
            // Put the modified image data back
            tempCtx.putImageData(imgData, 0, 0);
            
            // 2. Get bounding box of the remaining entity
            const box = getBoundingBox(imgData);
            
            // 3. Create final canvas
            const finalCanvas = createCanvas(size, size);
            const ctx = finalCanvas.getContext('2d');
            
            // 4. Draw white circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            if (box) {
                // 5. Draw trimmed entity centered and scaled
                const margin = 15;
                const maxTargetSize = size - (margin * 2);
                
                const scale = Math.min(maxTargetSize / box.width, maxTargetSize / box.height);
                const drawWidth = box.width * scale;
                const drawHeight = box.height * scale;
                
                const dx = (size - drawWidth) / 2;
                const dy = (size - drawHeight) / 2;
                
                ctx.drawImage(tempCanvas, box.x, box.y, box.width, box.height, dx, dy, drawWidth, drawHeight);
            }
            
            const outBuffer = await finalCanvas.encode('webp');
            fs.writeFileSync(imagePath, outBuffer);
            console.log(`Saved ${file}`);
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }
}

processImages();
