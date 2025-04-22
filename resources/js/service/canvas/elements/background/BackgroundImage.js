import Background from "./Background";
import {CanvasMaxSideLen, MaxImageZoomFactor} from "../../Constants";

export default class BackgroundImage extends Background {
    constructor() {
        super();

        this._image = null;

        this._containerWidth = 0; // width of the imagery canvas (!= background image width)
        this._containerHeight = 0; // height of the imagery canvas (!= background image width)

        this._zoom = 0;
    }

    set width(width) {
        this._setProperty('_containerWidth', width);
    }

    set height(height) {
        this._setProperty('_containerHeight', height);
    }

    set image(image) {
        this._setProperty('_image', image);
    }

    set zoom(zoom) {
        this._setProperty('_zoom', zoom);
    }

    get scaleUpLimit() {
        const naturalWidth = this._image.width;
        const minWidth = this._minImageWidth();
        const maxWidth = this._maxImageWidth();
        return (naturalWidth - minWidth) / (maxWidth - minWidth);
    }

    _drawBackground() {
        this._setCanvasSize();

        if (this._image) {
            this._context.drawImage(
                this._image,
                0,
                0,
                this._image.width,
                this._image.height,
                0,
                0,
                this._canvas.width,
                this._canvas.height
            );

            // if we just draw the image, we dont get an error if the uploaded
            // document isn't a processable image. if we, however repaint it
            // using the following line, an error is thrown as expected.
            this._context.drawImage(this._canvas, 0, 0);
        }
    }

    _setCanvasSize() {
        if (!this._image) {
            this._canvas.width = this._containerWidth;
            this._canvas.height = this._containerHeight;
            return;
        }

        const aspectRatioImage = this._image.width / this._image.height;
        const minImageWidth = this._minImageWidth();
        const maxImageWidth = this._maxImageWidth();
        const width = minImageWidth + (maxImageWidth - minImageWidth) * this._zoom;
        const height = width / aspectRatioImage;

        this._canvas.width = width;
        this._canvas.height = height;
    }

    _minImageWidth() {
        const wRatio = this._image.width / this._containerWidth;
        const hRatio = this._image.height / this._containerHeight;
        const ratio = Math.min(wRatio, hRatio);

        // if image is smaller than container, we want to use the image size
        if (ratio < 1) {
            return this._image.width;
        }

        // use the container width if the width ratio is smaller than the height ratio
        if (wRatio < hRatio) {
            return this._containerWidth;
        }

        // adjust the minimal width to fill the container height
        const aspectRatio = this._image.width / this._image.height;
        return this._containerHeight * aspectRatio;
    }

    _maxImageWidth() {
        const aspectRatio = this._image.width / this._image.height;

        if (aspectRatio > 1) {
            // landscape
            const maxZoomedWidth = this._image.width * MaxImageZoomFactor;
            return Math.min(maxZoomedWidth, CanvasMaxSideLen);
        } else {
            // portrait
            const maxZoomedHeight = this._image.height * MaxImageZoomFactor;
            const maxHeight = Math.min(maxZoomedHeight, CanvasMaxSideLen);
            return maxHeight * aspectRatio;
        }
    }
}
