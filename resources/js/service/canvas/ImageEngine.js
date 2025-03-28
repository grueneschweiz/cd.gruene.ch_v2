import isEqual from "lodash/isEqual";
import EngineEvents from "./engines/EngineEvents";
import BackgroundEngine from "./engines/BackgroundEngine";
import LogoEngine from "./engines/LogoEngine";
import BarEngine from "./engines/BarEngine";
import ShadowEngine from "./engines/ShadowEngine";
import {BackgroundTypes, StyleSetTypes} from "./Constants";
import BorderEngine from "./engines/BorderEngine";
import CopyrightEngine from "./engines/CopyrightEngine";


export default class ImageEngine {
    /**
     * @type {HTMLCanvasElement}
     * @private
     */
    _canvas;
    /**
     * @type {CanvasRenderingContext2D}
     * @private
     */
    _context;
    /**
     * @type {EngineEvents}
     * @private
     */
    _events;


    /**
     * @type {HTMLImageElement}
     * @private
     */
    _logoImage;
    /**
     * @type {String<LogoTypes>}
     * @private
     */
    _logoType;
    /**
     * @type {String<StyleSetTypes>}
     * @private
     */
    _styleSet;
    /**
     * @type {String<Formats>}
     * @private
     */
    _format;
    /**
     * The canvas width minus the bleed
     * @type {number}
     * @private
     */
    _visibleWidth;
    /**
     * The canvas height minus the bleed
     * @type {number}
     * @private
     */
    _visibleHeight;
    /**
     * The canvas width including the bleed
     * @type {number}
     * @private
     */
    _canvasWidth;
    /**
     * The canvas height including the bleed
     * @type {number}
     * @private
     */
    _canvasHeight;
    /**
     * @type {String<BackgroundTypes>}
     * @private
     */
    _backgroundType;
    /**
     * @type {HTMLImageElement}
     * @private
     */
    _backgroundImage;
    /**
     * Relative zoom of the background image
     *
     * Must be between 0 and 1
     *
     * 0 = image covers the canvas (if big enough, else it is equal to 1)
     * 1 = image has its native resolution
     *
     * @type {number}
     * @private
     */
    _backgroundZoom;
    /**
     * @type {string}
     * @private
     */
    _backgroundWatermarkText;
    /**
     * @type {[
     *   {
     *      type: String<BarTypes>,
     *      schema: Object<BarSchemes>,
     *      text: string,
     *      canvas: OffscreenCanvas|null,
     *      padding: number
     *   }
     * ]}
     * @private
     */
    _bars;
    /**
     * @type {boolean}
     * @private
     */
    _hasBars;
    /**
     * @type {boolean}
     * @private
     */
    _topShadow;
    /**
     * @type {boolean}
     * @private
     */
    _bottomShadow;
    /**
     * @type {boolean}
     * @private
     */
    _hasBorder;
    /**
     * @type {string}
     * @private
     */
    _copyrightText;
    /**
     * @type {Number<Alignments>}
     * @private
     */
    _alignment;
    /**
     * @type {number}
     * @private
     */
    _bleed;
    /**
     * Mouse position relative to the canvas
     *
     * @type {x: number, y: number}
     * @private
     */
    _mousePos;
    /**
     * @type {boolean}
     * @private
     */
    _dragging;
    /**
     * @param {boolean}
     * @private
     */
    _backgroundFocus;

    /**
     * @type {LogoEngine}
     * @private
     */
    _logoEngine;
    /**
     * @type {BackgroundEngine}
     * @private
     */
    _backgroundEngine;
    /**
     * @type {BarEngine}
     * @private
     */
    _barEngine;
    /**
     * @type {ShadowEngine}
     * @private
     */
    _shadowEngine;
    /**
     * @type {BorderEngine}
     * @private
     */
    _borderEngine;
    /**
     * @type {CopyrightEngine}
     * @private
     */
    _copyrightEngine;

    /**
     * Tracks if repaints are needed
     * @type {boolean}
     * @private
     */
    _dirty = false;
    /**
     * Position of the bar block relative to the canvas
     *
     * @type {{x0: number, y0: number, x1: number, y1: number}}
     * @private
     */
    _barPos;
    /**
     * @type {number}
     * @private
     */
    _borderWidth;
    /**
     * @param {boolean}
     * @private
     */
    _backgroundDragging;
    /**
     * @param {boolean}
     * @private
     */
    _barDragging;
    /**
     * @param {boolean}
     * @private
     */
    _barFocus;

    constructor() {
        this._events = new EngineEvents();

        this._canvas = document.createElement('canvas');
        this._context = this._canvas.getContext('2d');
        this._context.imageSmoothingEnabled = true;
        this._context.imageSmoothingQuality = 'high';

        this._events.on('_canvasWidth', w => this._canvas.width = w);
        this._events.on('_canvasHeight', h => this._canvas.height = h);

        this._events.on('_borderWidth', w => this._borderWidth = w);
        this._events.on('_barPos', p => this._barPos = p);
        this._events.on('_dragging', d => this._setDragging(d));
        this._events.on('_mousePos', () => this._setFocus());
        this._events.on('dirty', () => this._dirty = true);

        this._logoEngine = new LogoEngine(this._events, this._canvas, this._context);
        this._backgroundEngine = new BackgroundEngine(this._events, this._canvas, this._context);
        this._barEngine = new BarEngine(this._events, this._canvas, this._context);
        this._shadowEngine = new ShadowEngine(this._events, this._canvas, this._context);
        this._borderEngine = new BorderEngine(this._events, this._canvas, this._context);
        this._copyrightEngine = new CopyrightEngine(this._events, this._canvas, this._context);
    }

    /**
     * Relative font size. Must be between 1 and 100
     *
     * @type {number}
     * @private
     */
    _fontSizePercent;

    /**
     * Preview dimensions
     *
     * @type {{width: number, height: number}}
     * @private
     */
    _previewDims;

    set logoImage(image) {
        this._setProperty('_logoImage', image);
    }

    set logoType(logoType) {
        this._setProperty('_logoType', logoType);
    }

    set styleSet(styleSet) {
        this._setProperty('_styleSet', styleSet);
    }

    set format(format) {
        this._setProperty('_format', format);
    }

    set bleed(bleed) {
        this._setProperty('_bleed', bleed);
    }

    set visibleWidth(width) {
        this._setProperty('_canvasWidth', width + this._bleed * 2);
        this._setProperty('_visibleWidth', width);
    }

    set visibleHeight(height) {
        this._setProperty('_canvasHeight', height + this._bleed * 2);
        this._setProperty('_visibleHeight', height);
    }

    set backgroundType(type) {
        this._setProperty('_backgroundType', type);
    }

    set backgroundImage(image) {
        this._setProperty('_backgroundImage', image);
    }

    set backgroundZoom(zoom) {
        this._setProperty('_backgroundZoom', zoom);
    }

    set backgroundWatermarkText(text) {
        this._setProperty('_backgroundWatermarkText', text);
    }

    set fontSizePercent(size) {
        this._setProperty('_fontSizePercent', size);
    }

    set bars(bars) {
        this._setProperty('_bars', bars, true);
        this._setProperty('_hasBars', !!this._bars.filter(bar => bar.text.length).length);
    }

    set topShadow(shadow) {
        this._setProperty('_topShadow', shadow);
    }

    set bottomShadow(shadow) {
        this._setProperty('_bottomShadow', shadow);
    }

    set hasBorder(hasBorder) {
        this._setProperty('_hasBorder', hasBorder);
    }

    set copyrightText(text) {
        this._setProperty('_copyrightText', text);
    }

    set alignment(alignment) {
        this._setProperty('_alignment', alignment);
    }

    set mousePos(pos) {
        this._setProperty('_mousePos', pos);
    }

    set dragging(dragging) {
        this._setProperty('_dragging', dragging);
    }

    set previewDims(dims) {
        this._setProperty('_previewDims', dims);
    }

    draw(forceRepaint = false) {
        if (!this._dirty && !forceRepaint) {
            return this._canvas;
        }

        this._setProperty('_borderWidth', this._borderEngine.getBorderWidth());

        this._backgroundEngine.draw(forceRepaint);

        if (this._styleSet === StyleSetTypes.young) {
            this._shadowEngine.draw(forceRepaint);
        }

        if (this._styleSet === StyleSetTypes.green) {
            this._borderEngine.draw(forceRepaint);
        }

        if (this._hasBars) {
            this._barEngine.draw(forceRepaint);
        }

        if (this._styleSet !== StyleSetTypes.greenCentered) {
            this._logoEngine.draw(forceRepaint);
        }

        if (this._backgroundType === BackgroundTypes.image) {
            this._copyrightEngine.draw(forceRepaint);
        }

        this._dirty = false;

        return this._canvas;
    }

    getLogoWidth() {
        return this._logoEngine.getLogoWidth();
    }

    getBackgroundTouching() {
        return this._backgroundEngine.getTouching();
    }

    getBackgroundDraggable() {
        return this._backgroundEngine.getDraggable();
    }

    getBarTouching() {
        return this._barEngine.getTouching();
    }

    getBarDraggable() {
        return this._barEngine.getDraggable();
    }

    getTextFitsImage() {
        return this._barEngine.getTextFitsImage();
    }

    getScaleUpLimit() {
        return this._backgroundEngine.getScaleUpLimit();
    }

    needsRepaint() {
        return this._dirty;
    }

    _setProperty(property, value, forcePropagate = false) {
        if (!(property in this)) {
            throw new Error(`Property '${property}' does not exist.`);
        }

        if (!forcePropagate && isEqual(this[property], value)) {
            return;
        }

        this[property] = value;
        this._events.trigger(property, value);
    }

    _setDragging(dragging) {
        if (!dragging) {
            this._setProperty('_backgroundDragging', false);
            this._setProperty('_barDragging', false);
            return;
        }

        if (this._barEngine.getTouching() && !this._backgroundDragging) {
            this._setProperty('_barDragging', true);
            this._setProperty('_backgroundDragging', false);
            return;
        }

        if (this._backgroundEngine.getTouching() && !this._barDragging) {
            this._setProperty('_backgroundDragging', true);
            this._setProperty('_barDragging', false);
            return;
        }
    }

    _setFocus() {
        if (this._barDragging
            || (this._barEngine.getTouching() && !this._backgroundDragging)
        ) {
            this._setProperty('_barFocus', true);
            this._setProperty('_backgroundFocus', false);
            return;
        }

        if (this._backgroundDragging
            || (this._backgroundEngine.getTouching() && !this._barDragging)
        ) {
            this._setProperty('_backgroundFocus', true);
            this._setProperty('_barFocus', false);
            return;
        }
    }
}
