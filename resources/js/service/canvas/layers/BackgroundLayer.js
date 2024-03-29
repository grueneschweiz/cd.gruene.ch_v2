import DraggableLayer from "./DraggableLayer";
import * as MarkHelper from "../misc/MarkHelper";

export default class BackgroundLayer extends DraggableLayer {
    constructor(canvas, context) {
        super(canvas, context);

        this._y = 0;
        this._x = 0;

        this._lastWidth = 0;
        this._lastHeight = 0;

        this._hasBorder = false;
        this._borderWidth = 0;

        this._markSelected = false;
        this._markActive = false;
        this._previewDims = {
            width: 0,
            height: 0,
        };
    }

    set block(block) {
        if (!this._block) {
            this._lastWidth = block.width;
            this._lastHeight = block.height;
        }

        super.block = block;
    }

    set hasBorder(value) {
        this._hasBorder = value;
    }

    set borderWidth(value) {
        this._borderWidth = value;
    }

    set markSelected(value) {
        this._markSelected = value;
    }

    set markActive(value) {
        this._markActive = value;
    }

    set previewDims(dims) {
        this._previewDims = dims;
    }

    get draggable() {
        if (!this._block) {
            return false;
        }

        const oversizeX = this._block.width > this._innerCanvasWidth();
        const oversizeY = this._block.height > this._innerCanvasHeight();

        return oversizeX || oversizeY;
    }

    _drag(pos) {
        const deltaX = pos.x - this._mousePos.x;
        const deltaY = pos.y - this._mousePos.y;

        this._x += deltaX;
        this._y += deltaY;
    }

    _clear() {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }

    _drawBlock() {
        this._clear();

        if (this._lastWidth !== this._block.width) {
            this._setZoomPosition();
        }

        this._moveIntoCanvas();

        this._context.drawImage(this._block, this._x, this._y);

        if (this._markSelected && this.draggable) {
            this._drawSelectedMark();
        }
    }

    _setZoomPosition() {
        const srcOldW = this._lastWidth;
        const srcOldH = this._lastHeight;
        const srcNewW = this._block.width;
        const srcNewH = this._block.height;

        const dstW = this._canvas.width;
        const dstH = this._canvas.height;

        const visibleCenterX = -this._x + dstW / 2;
        const visibleCenterY = -this._y + dstH / 2;

        const factorX = visibleCenterX / srcOldW;
        const factorY = visibleCenterY / srcOldH;

        const deltaX = (srcNewW - srcOldW) * factorX;
        const deltaY = (srcNewH - srcOldH) * factorY;

        this._x = this._x - deltaX;
        this._y = this._y - deltaY;

        this._lastWidth = srcNewW;
        this._lastHeight = srcNewH;
    }

    _moveIntoCanvas() {
        this._x = this._getPositionBoundary(
            this._x,
            this._innerCanvasWidth(),
            this._block.width
        );

        this._y = this._getPositionBoundary(
            this._y,
            this._innerCanvasHeight(),
            this._block.height
        );
    }

    _getPositionBoundary(axis, innerCanvasSize, blockSize) {
        let offset = this._edgeToInnerDistance();

        if (blockSize < innerCanvasSize) {
            // center if the block is smaller than the canvas
            return ((innerCanvasSize - blockSize) / 2) + offset;
        }

        const lower = offset;
        const upper = innerCanvasSize - blockSize + offset;

        if (axis > lower) return lower;
        if (axis < upper) return upper;

        return axis;
    }

    _isHover() {
        if (!this._block) {
            return false;
        }

        let offset = this._edgeToInnerDistance();

        if (!this._hasBorder) {
            offset += this._bleed;
        }

        const mouseX = this._mousePos.x;
        const mouseY = this._mousePos.y;

        const posXstart = Math.max(offset, this._x);
        const posXend = Math.min(
            this._canvas.width - offset,
            this._x + this._block.width
        );

        const posYstart = Math.max(offset, this._y);
        const posYend = Math.min(
            this._canvas.height - offset,
            this._y + this._block.height
        );

        const xTouch = mouseX >= posXstart && mouseX <= posXend;
        const yTouch = mouseY >= posYstart && mouseY <= posYend;

        return xTouch && yTouch;
    }

    /**
     * The width, that is effectively visible
     *
     * If the image has a border, it is the width inside the border. Else it is
     * the canvas width (which may contain some printing bleed).
     *
     * @private
     */
    _innerCanvasWidth() {
        if (this._hasBorder) {
            return this._canvas.width - 2 * this._borderWidth - 2 * this._bleed;
        }

        return this._canvas.width;
    }

    /**
     * The height, that is effectively visible
     *
     * If the image has a border, it is the height inside the border. Else it is
     * the canvas height (which may contain some printing bleed).
     *
     * @private
     */
    _innerCanvasHeight() {
        if (this._hasBorder) {
            return this._canvas.height - 2 * this._borderWidth - 2 * this._bleed;
        }

        return this._canvas.height;
    }

    _edgeToInnerDistance() {
        if (this._hasBorder) {
            return this._borderWidth + this._bleed;
        }

        return 0;
    }

    _drawSelectedMark() {
        const offset = this._edgeToInnerDistance();

        this._context.fillStyle = MarkHelper.getMarkBackgroundColor(this._markActive);
        this._context.fillRect(
            offset,
            offset,
            this._innerCanvasWidth(),
            this._innerCanvasHeight()
        );

        const lineWidth = MarkHelper.getMarkLineWidth(
            this._previewDims,
            {width: this._canvas.width, height: this._canvas.height}
        );

        this._context.lineWidth = lineWidth;
        this._context.strokeStyle = MarkHelper.getMarkColor(this._markActive);
        this._context.strokeRect(
            offset + lineWidth / 2,
            offset + lineWidth / 2,
            this._innerCanvasWidth() - lineWidth,
            this._innerCanvasHeight() - lineWidth
        );
    }
}
