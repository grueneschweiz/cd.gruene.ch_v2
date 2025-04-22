import BarLayerGreen from "./BarLayerGreen";
import { Alignments } from "../../Constants";

/**
 * The distance from the border to the barlayer is calculated as a factor of the shorter side.
 *
 * @type {number}
 */
const layerPaddingFactor = 0.07;

export default class BarLayerGreen2025 extends BarLayerGreen {

    constructor(canvas, context) {
        super(canvas, context);
        this._rotationAngle = 0;
        this.layerPadding = Math.min(this._canvas.width, this._canvas.height) * layerPaddingFactor;
    }

    _getBlockXpos() {
        switch (this._alignment) {
            case Alignments.right:
                return this._canvas.width
                    - this._getBlockWidth()
                    - this.layerPadding;
            default:
                return this.layerPadding;
        }
    }
}
