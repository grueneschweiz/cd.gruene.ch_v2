import BackgroundImage from "./BackgroundImage";

export default class BackgroundIcons extends BackgroundImage {

    constructor() {
        super();
        this._image = this.iconsImage
    }
    
    _drawBackground() {
        super._drawBackground();
    }
}

// Avoid drawing the BackgroundImage before iconsBackground is available
BackgroundIcons.prototype.iconsImage = new Image();
BackgroundIcons.prototype.iconsImage.src = 'images/iconsBackground.png';