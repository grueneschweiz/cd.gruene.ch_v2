import {BarSizeFactor, Alignments, RotationAngle} from "../../Constants";
import BarLayer from "./BarLayer";

/**
 * Defines, how close to the border (y-axis) the bar block may be dragged.
 * Applied, if the closest point is in the middle of the image.
 *
 * @type {number}
 */
const borderMarginFactor = 2;

/**
 * Defines, how close to the border (y-axis) the bar block may be dragged.
 * Applied, if the closest point is in the (rounded) corner of the image.
 *
 * @type {number}
 */
const borderMarginFactorRadius = 2;

/**
 * Defines the distance of the text (closest bar) to the border (x-axis).
 *
 * @type {number}
 */
const textPaddingFactor = 2;

export default class BarLayerGreen extends BarLayer {
    constructor(canvas, context) {
        super(canvas, context);
        this._rotationAngle = RotationAngle
    }

    _getTopLimit() {
        const margin = this._alignment === Alignments.right
            ? borderMarginFactorRadius * this._borderWidth
            : borderMarginFactor * this._borderWidth
        return margin
            + this._bleed
            + this._getFullHorizontalRotationTriangleHeight()
    }

    _getBottomLimit() {
        const margin = this._alignment === Alignments.left
            ? borderMarginFactorRadius * this._borderWidth
            : borderMarginFactor * this._borderWidth
        return this._canvas.height
            - margin
            - this._bleed
            - this._getBlockHeight()
    }

    _drawBlockConcrete() {
        // move the origin to the desired position, then rotate. apply the
        // image to the origin afterwards. this way the offsets are measured
        // horizontal and vertical respectively (unrotated). reset the origin
        // and rotation afterwards.
        this._context.translate(this._getBlockXpos(), this._getBlockYpos());
        this._context.rotate(this._rotationAngle);
        this._context.drawImage(this._block, 0, 0);
        this._context.setTransform(1, 0, 0, 1, 0, 0);
    }

    _getBlockXpos() {
        switch (this._alignment) {
            case Alignments.left:
                return this._bleed
                    - this._getBlockOversize()
            case Alignments.right:
                return this._canvas.width
                    - this._bleed
                    - this._getBlockWidth()
                    + this._getBlockOversize()
            default:
                return (this._canvas.width - this._getBlockWidth()) / 2
        }
    }

    _getXstart() {
        return this._getBlockXpos();
    }

    _getXend() {
        return this._getBlockXpos() + this._getRotatedFullWidth();
    }

    _getYstart() {
        return this._alignment === Alignments.left ?
            this._getBlockYpos() - this._getFullHorizontalRotationTriangleHeight() :
            this._getBlockYpos() - this._getVisibleHorizontalRotationTriangleHeight();
    }

    _getYend() {
        return this._getYstart() + this._getRotatedVisibleHeight();
    }

    _getRotatedVisibleHeight() {
        return this._getBlockHeight() + this._getVisibleHorizontalRotationTriangleHeight();
    }

    _getRotatedFullWidth() {
        return this._getBlockWidth() + Math.sin(-this._rotationAngle) * this._getBlockHeight();
    }

    _getBlockOversize() {
        const paddingX = this._textPadding * textPaddingFactor;

        if (this._alignment === Alignments.left) {
            return this._getVisibleCanvasWidth() * BarSizeFactor - paddingX;
        }

        const rotationCorr = Math.sin(this._rotationAngle) * this._getBlockHeight();
        return this._getVisibleCanvasWidth() * BarSizeFactor + rotationCorr - paddingX;
    }

    _getVisibleHorizontalRotationTriangleHeight() {
        return Math.sin(-this._rotationAngle) * this._getVisibleBlockWidth();
    }

    _getFullHorizontalRotationTriangleHeight() {
        return Math.sin(-this._rotationAngle) * this._getBlockWidth();
    }

    _getVisibleBlockWidth() {
        return this._getBlockWidth() - this._getBlockOversize();
    }

    _getVisibleCanvasWidth() {
        return this._canvas.width - 2 * this._bleed;
    }
}
