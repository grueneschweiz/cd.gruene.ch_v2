import DrawBase from "../misc/DrawBase";

class LogoBlock extends DrawBase {
    constructor() {
        super();

        this._logo = null;
    }

    set logo(logo) {
        this._setProperty('_logo', logo);
    }

    _draw() {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        if (this._hasLogo()) {
            this._drawLogo();
        }
    }

    _hasLogo() {
        return this._logo && this._logo.width > 0 && this._logo.height > 0;
    }

    _drawLogo() {
        this._setSize();

        this._context.drawImage(this._logo, 0, 0);
    }

    _setSize() {
        this._canvas.width  = this._logo.width;
        this._canvas.height = this._logo.height;
    }
}

export {
    LogoBlock
}
