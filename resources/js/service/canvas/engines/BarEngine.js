import DraggableSubEngine from "./DraggableSubEngine";
import {Alignments, BarTypes, StyleSetTypes} from "../Constants";
import BarLayerYoung from "../layers/bar/BarLayerYoung";
import BarLayerGreenCenter from "../layers/bar/BarLayerGreenCenter";
import BarLayerGreen from "../layers/bar/BarLayerGreen";
import BarLayerGreen2025 from "../layers/bar/BarLayerGreen2025";
import BarLayerGreen2025Center from "../layers/bar/BarLayerGreen2025Center";
import BarYoung from "../elements/bar/BarYoung";
import BarGreenCentered from "../elements/bar/BarGreenCentered";
import BarGreen2025Centered from "../elements/bar/BarGreen2025Centered";
import BarGreen from "../elements/bar/BarGreen";
import BarGreen2025 from "../elements/bar/BarGreen2025";
import BarBlockYoung from "../blocks/bar/BarBlockYoung";
import BarBlockGreenCenter from "../blocks/bar/BarBlockGreenCenter";
import BarBlockGreen from "../blocks/bar/BarBlockGreen";
import BarBlockGreen2025 from "../blocks/bar/BarBlockGreen2025";
import BarBlockGreen2025Center from "../blocks/bar/BarBlockGreen2025Center";
import FontSizeHelper from "../misc/FontSizeHelper";

export default class BarEngine extends DraggableSubEngine {
    _alignment;
    _borderWidth;
    _styleSet;
    _bars;
    _fontSizePercent;
    _previewDims;
    _dragging;
    _focus;

    _currentStyleSet;
    _textPadding;
    _fontSizeHelper;

    constructor(events, canvas, drawingContext) {
        super(events, canvas, drawingContext);

        this._fontSizeHelper = new FontSizeHelper(events);

        this._events.on('_alignment', value => this._setProperty('_alignment', value));
        this._events.on('_borderWidth', value => this._setProperty('_borderWidth', value));
        this._events.on('_styleSet', value => this._setProperty('_styleSet', value));
        this._events.on('_bars', value => this._setProperty('_bars', value));
        this._events.on('_fontSizePercent', value => this._setProperty('_fontSizePercent', value));
        this._events.on('_barDragging', value => this._setProperty('_dragging', value));
        this._events.on('_barFocus', value => this._setProperty('_focus', value));
        this._events.on('_previewDims', value => this._setProperty('_previewDims', value));
    }

    draw(forceRepaint = false) {
        this._setObjects();
        this._setBaseFontSize();

        let changed = forceRepaint;
        changed = this._drawElements(changed);
        changed = this._drawBlock(changed);
        this._drawLayer(true);

        this._events.trigger('barEngineDrawn', changed);
    }

    getDraggable() {
        return this._layer?.draggable || false;
    }

    getTouching() {
        if (!this._layer) {
            return false;
        }

        this._layer.mousePos = this._mousePos;

        return this._layer.touching;
    }

    getTextFitsImage() {
        return this._fontSizeHelper.textFitsImage;
    }

    _drawLayer(forceRepaint = false) {
        const barPos = this._layer.boundingRect;

        this._layer.block = this._block.draw();
        this._layer.alignment = this._alignment;
        this._layer.borderWidth = this._borderWidth;
        this._layer.textPadding = this._textPadding;
        this._layer.mousePos = this._mousePos;
        this._layer.dragging = this._dragging;
        this._layer.bleed = this._bleed;

        const repaint = this._layer.isDirty() || forceRepaint;
        this._layer.draw(repaint);

        if (barPos !== this._layer.boundingRect) {
            this._events.trigger('_barPos', this._layer.boundingRect);
        }

        this._events.trigger('barLayerDrawn', repaint);

        return repaint;
    }

    _drawBlock(forceRepaint = false) {
        this._block = this._createBlock();
        this._block.alignment = this._alignment;

        const repaint = this._block.isDirty() || forceRepaint;
        this._block.draw(repaint);

        this._events.trigger('barBlockDrawn', repaint);

        return repaint;
    }

    _drawElements(forceRepaint = false) {
        let repaint = forceRepaint;

        this._setElementProps();

        this._element.forEach((element, index) => {
            repaint = element.isDirty() || repaint;
            this._bars[index].canvas = element.draw(repaint);
            this._bars[index].padding = element.padding;
        });

        this._textPadding = this._element[0]?.padding || 0;

        this._events.trigger('barElementsDrawn', repaint);

        return repaint;
    }

    _setElementProps() {
        this._element.forEach((element, index) => {
            element.type = this._bars[index].type;
            element.text = this._bars[index].text;
            element.baseFontSize = this._baseFontSize;
            element.alignment = this._alignment;
            element.schema = this._bars[index].schema;
            element.imageWidth = this._visibleWidth;
            element.imageHeight = this._visibleHeight;
            element.markSelected = this.getTouching() && this._focus;
            element.markActive = this._dragging;
            element.previewDims = this._previewDims;

            if (this._styleSet === StyleSetTypes.young) {
                element.isFirstSubline = index === this._bars.findIndex(bar => bar.type === BarTypes.subline);
            }
        });
    }

    _setObjects() {
        if (this._currentStyleSet !== this._styleSet
            || this._element?.length !== this._bars.length
        ) {
            this._element = this._bars.map(() => this._createElement());
        }

        if (this._currentStyleSet !== this._styleSet) {
            this._layer = this._createLayer();
            this._currentStyleSet = this._styleSet;
        }

        // this._block is set in this._drawBlock()
    }

    _createElement() {
        switch (this._styleSet) {
            case StyleSetTypes.young:
                return new BarYoung();
            case StyleSetTypes.greenCentered:
                return new BarGreenCentered();
            case StyleSetTypes.green2025:
                return new BarGreen2025();
            case StyleSetTypes.green2025Centered:
                return new BarGreen2025Centered();
            default:
                return new BarGreen();
        }
    }

    _createBlock() {
        const barCanvasses = this._bars.map(bar => bar.canvas);

        switch (this._styleSet) {
            case StyleSetTypes.young:
                return new BarBlockYoung(barCanvasses);
            case StyleSetTypes.greenCentered:
                return new BarBlockGreenCenter(barCanvasses);
            case StyleSetTypes.green2025:
                return new BarBlockGreen2025(barCanvasses);
            case StyleSetTypes.green2025Centered:
                return new BarBlockGreen2025Center(barCanvasses);
            default:
                return new BarBlockGreen(barCanvasses);
        }
    }

    _createLayer() {
        switch (this._styleSet) {
            case StyleSetTypes.young:
                return new BarLayerYoung(this._canvas, this._context);
            case StyleSetTypes.greenCentered:
                return new BarLayerGreenCenter(this._canvas, this._context);
            case StyleSetTypes.green2025:
                return new BarLayerGreen2025(this._canvas, this._context);
            case StyleSetTypes.green2025Centered:
                return new BarLayerGreen2025Center(this._canvas, this._context);
            default:
                return new BarLayerGreen(this._canvas, this._context);
        }
    }

    _setBaseFontSize() {
        this._setElementProps();
        this._baseFontSize = this._fontSizeHelper.getBaseFontSize(this._element);
    }
}
