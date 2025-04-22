import BackgroundImage from "./BackgroundImage";

export default class BackgroundIcons extends BackgroundImage {
    constructor() {
        super();
        this._image = this.iconsImage;
    }
    
    _drawBackground() {
        if (!this._image) {
            return;
        }

        // Calculate the scaled dimensions for a single tile
        const minImageWidth = this._minImageWidth();
        const maxImageWidth = this._maxImageWidth();
        const scaledWidth = minImageWidth + (maxImageWidth - minImageWidth) * this._zoom;
        const aspectRatio = this._image.width / this._image.height;
        const scaledHeight = scaledWidth / aspectRatio;

        // Calculate how many tiles we need in each direction
        const numTilesX = Math.ceil(this._containerWidth / scaledWidth);
        const numTilesY = Math.ceil(this._containerHeight / scaledHeight);

        // Set canvas size to fit all tiles exactly
        this._canvas.width = numTilesX * scaledWidth;
        this._canvas.height = numTilesY * scaledHeight;

        // Draw the image in a tiled pattern
        for (let y = 0; y < numTilesY; y++) {
            for (let x = 0; x < numTilesX; x++) {
                const destX = x * scaledWidth;
                const destY = y * scaledHeight;

                this._context.drawImage(
                    this._image,
                    0,
                    0,
                    this._image.width,
                    this._image.height,
                    destX,
                    destY,
                    scaledWidth,
                    scaledHeight
                );
            }
        }

        // Repaint to validate the image
        this._context.drawImage(this._canvas, 0, 0);
    }
}

// Avoid drawing the BackgroundImage before iconsBackground is available
BackgroundIcons.prototype.iconsImage = new Image();
BackgroundIcons.prototype.iconsImage.src = 'images/iconsBackground.png';