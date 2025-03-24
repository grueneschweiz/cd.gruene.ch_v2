import {
    BarSchemes as Schemes
} from "../../Constants";

import BarGreen from "./BarGreen";

export default class BarGreen2025 extends BarGreen {

    constructor() {
        super();
        this._schema = Schemes.green2025;
    }

    _setBarOversize() {
        this._barOversize = this._textDims.padding;
    }

    _setGradientBackground() {
        this._context.fillStyle = this._schema.background;
    }
}
