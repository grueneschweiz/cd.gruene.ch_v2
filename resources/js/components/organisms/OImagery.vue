<template>
    <div class="o-imagery" ref="container">
        <div class="o-imagery__controls-1">
            <MLogoBlock/>
            <MStyleSetBlock/>
            <MFormat/>
            <MSizeBlock/>
            <MBackgroundBlock :bgImageId="bgImageId"/>
        </div>

        <div class="o-imagery__preview">
            <h3 class="d-block">{{$t('images.create.preview')}}</h3>
            <div class="o-imagery__canvas-zone" ref="canvasZone">
                <canvas
                    :class="canvasClasses"
                    :style="canvasStyles"
                    @mousedown.stop="mouseDragStart($event)"
                    @mousemove.stop="mouseMove($event)"
                    @mouseout.stop="mouseLeave($event)"
                    @mouseenter.stop="mouseEnter($event)"
                    @mouseup.stop="mouseDragStop($event)"
                    @touchcancel.stop="touchDragStop($event)"
                    @touchend.stop="touchDragStop($event)"
                    @touchmove.stop.prevent="touchDragMove($event)"
                    @touchstart.stop="touchDragStart($event)"
                    class="o-imagery__canvas"
                    id="canvas"
                    ref="canvas"
                >You definitely need a newer browser!
                </canvas>
                <ALoader v-if="loading" class="o-imagery__canvas-loader"/>
            </div>
            <small v-if="backgroundIsDraggable">{{$t('images.create.dragHelp')}}</small>
            <small v-else>{{$t('images.create.dragHelpBar')}}</small>
        </div>

        <div class="o-imagery__controls-2">
            <MBarBlock class="mt-2"/>

            <MCopyright
                v-if="hasImageBackground"
            />

            <MAlignment
                v-if="styleSet === styleSetTypes.green ||
                styleSet === styleSetTypes.green2025 ||
                styleSet === styleSetTypes.green2025Centered"
            />

            <MColorScheme/>

            <MShadowBlock
                v-if="styleSet === styleSetTypes.young"
            />

            <MBorderBlock/>

            <div class="d-sm-flex align-items-center mb-3">
                <button
                    :disabled="backgroundType === backgroundTypes.placeholder"
                    class="btn btn-primary"
                    @click="save()">{{$t('images.create.generate')}}
                </button>
                <small
                    v-if="backgroundType === backgroundTypes.placeholder"
                    class="d-block ml-sm-2"
                >{{ $t('images.create.placeholderDisabledSave') }}</small>
            </div>

        </div>
    </div>
</template>

<script>
import {BackgroundTypes, HugeImageSurfaceLimit, StyleSetTypes} from "../../service/canvas/Constants";
import MBarBlock from "../molecules/MBarBlock";
import MBackgroundBlock from "../molecules/MBackgroundBlock";
import MBorderBlock from "../molecules/MBorderBlock";
import MLogoBlock from "../molecules/MLogoBlock";
import MStyleSetBlock from "../molecules/MStyleSetBlock";
import MSizeBlock from "../molecules/MSizeBlock";
import MAlignment from "../molecules/MAlignment";
import MColorScheme from "../molecules/MColorScheme";
import MShadowBlock from "../molecules/MShadowBlock";
import debounce from 'lodash/debounce';
import MCopyright from "../molecules/MCopyright";
import {mapGetters} from "vuex";
import MFormat from "../molecules/MFormat.vue";
import ImageEngine from "../../service/canvas/ImageEngine";
import ALoader from "../atoms/ALoader.vue";

let requestedAnimationFrame;

    export default {
        name: "OImagery",
        components: {
            ALoader,
            MFormat,
            MCopyright,
            MAlignment,
            MSizeBlock,
            MBorderBlock,
            MBackgroundBlock,
            MBarBlock,
            MColorScheme,
            MLogoBlock,
            MStyleSetBlock,
            MShadowBlock,
        },

        props: {
            bgImageId: {
                type: Number,
                default: null,
                required: false,
            }
        },

        data() {
            return {
                canvas: null,
                context: null,
                backgroundTypes: BackgroundTypes,
                styleSetTypes: StyleSetTypes,

                viewHeight: document.documentElement.clientHeight,
                viewWidth: document.documentElement.clientWidth,
                canvasZoneLeft: 0,
                canvasPos: {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                },

                mousePos: {
                    x: -1,
                    y: -1
                },
                dragging: false,

                drawPromises: new Map(),
                engine: new ImageEngine(),
                initialized: false,
                finalImage: null,

                dragObj: null,
            }
        },

        computed: {
            ...mapGetters({
                logoImage: 'canvas/getLogoImage',
                logoType: 'canvas/getLogoType',
                styleSet: 'canvas/getStyleSet',
                format: 'canvas/getFormat',
                visibleHeight: 'canvas/getImageHeight',
                visibleWidth: 'canvas/getImageWidth',
                backgroundType: 'canvas/getBackgroundType',
                backgroundImage: 'canvas/getBackgroundImage',
                backgroundZoom: 'canvas/getBackgroundZoom',
                backgroundWatermarkText: 'canvas/getBackgroundWatermarkText',
                bars: 'canvas/getBars',
                fontSizePercent: 'canvas/getFontSizePercent',
                hasTopShadow: 'canvas/getHasTopShadow',
                hasBottomShadow: 'canvas/getHasBottomShadow',
                hasBorder: 'canvas/getHasBorder',
                copyrightText: 'canvas/getCopyrightText',
                alignment: 'canvas/getAlignment',
                fontsLoaded: 'canvas/getFontsLoaded',
                bleed: 'canvas/getBleed',
                showBleed: 'canvas/getShowBleed',
                backgroundIsLoading: 'canvas/getBackgroundIsLoading',
                logoIsLoading: 'canvas/getLogoIsLoading',
            }),

            canvasWidth() {
                return this.showBleed ? this.visibleWidth + this.bleed * 2 : this.visibleWidth;
            },

            canvasHeight() {
                return this.showBleed ? this.visibleHeight + this.bleed * 2 : this.visibleHeight;
            },

            canvasClasses() {
                return {
                    'dragging': this.dragging,
                    'image-touching': this.engine.getBackgroundDraggable() && this.engine.getBackgroundTouching(),
                    'bar-touching': this.engine.getBarDraggable() && this.engine.getBarTouching(),
                    'transparent': this.backgroundType === BackgroundTypes.transparent,
                    'image': this.backgroundType === BackgroundTypes.image,
                    'huge': this.hugeCanvas,
                    'disabled': this.loading,
                }
            },

            canvasStyles() {
                return `height: ${this.previewDims.height}px; width: ${this.previewDims.width}px;`;
            },

            hugeCanvas() {
                return this.visibleWidth * this.visibleHeight > HugeImageSurfaceLimit;
            },

            previewDims() {
                const paddingX = 30;
                const paddingY = 160;
                const vh = this.viewHeight;
                const vw = this.viewWidth;

                const maxHeight = vw < 768 ? 250 : vh - paddingY;
                const maxWidth = vw < 768 ? vw - paddingX : vw - this.canvasZoneLeft - paddingX;

                const imgHeight = this.canvasHeight / 2;
                const imgWidth = this.canvasWidth / 2;

                const hRatio = imgHeight / maxHeight;
                const wRatio = imgWidth / maxWidth;

                let ratio = Math.max(hRatio, wRatio);
                ratio = ratio < 1 ? 1 : ratio;

                const height = imgHeight / ratio;
                const width = imgWidth / ratio;

                return {
                    height,
                    width,
                }
            },

            hasImageBackground() {
                return this.backgroundType === BackgroundTypes.image && this.backgroundImage;
            },

            backgroundIsDraggable() {
                if (!this.hasImageBackground) {
                    return false;
                }

                return this.visibleWidth < this.backgroundImage.width
                    || this.visibleHeight < this.backgroundImage.height;
            },

            loading() {
                return this.backgroundIsLoading || this.logoIsLoading;
            }
        },

        created() {
            window.addEventListener('resize', this.setViewDims);
            window.addEventListener('resize', this.setCanvasZoneLeft);
        },

        mounted() {
            this.canvas = this.$refs.canvas;

            this.setCanvasZoneLeft();

            this.$nextTick(() => {
                this.canvas.width = this.canvasWidth;
                this.canvas.height = this.canvasHeight;
                this.context = this.canvas.getContext('2d');

                this.setInitialEngineProps();
                this.updateLogoWidth();
                this.draw().catch(console.debug);
            });
        },

        destroyed() {
            window.removeEventListener('resize', this.setViewDims);
            window.removeEventListener('resize', this.setCanvasZoneLeft);
        },

        methods: {
            setInitialEngineProps() {
                const engine = this.engine;

                engine.logoImage = this.logoImage;
                engine.logoType = this.logoType;
                engine.styleSet = this.styleSet;
                engine.format = this.format;
                engine.bleed = this.bleed;
                engine.visibleWidth = this.visibleWidth;
                engine.visibleHeight = this.visibleHeight;
                engine.backgroundType = this.backgroundType;
                engine.backgroundImage = this.backgroundImage;
                engine.backgroundZoom = this.backgroundZoom;
                engine.backgroundWatermarkText = this.backgroundWatermarkText;
                engine.bars = this.bars;
                engine.fontSizePercent = this.fontSizePercent;
                engine.topShadow = this.hasTopShadow;
                engine.bottomShadow = this.hasBottomShadow;
                engine.hasBorder = this.hasBorder;
                this.setCopyrightText();
                engine.alignment = this.alignment;
                engine.mousePos = this.mousePos;
                engine.dragging = this.dragging;

                this.initialized = true;
            },

            updateLogoWidth() {
                this.$store.dispatch('canvas/setLogoWidth', this.engine.getLogoWidth())
            },

            updateScaleUpLimit() {
                this.$store.dispatch('canvas/setScaleUpLimit', this.engine.getScaleUpLimit())
            },

            updateTextFitsImage() {
                this.$store.dispatch('canvas/setTextFitsImage', this.engine.getTextFitsImage())
            },

            setCopyrightText() {
                if (this.copyrightText) {
                    this.engine.copyrightText = this.$t('images.create.imageCopyInfo', {photographer: this.copyrightText});
                } else {
                    this.engine.copyrightText = '';
                }
            },

            draw(forceRepaint = false) {
                if (!this.initialized) {
                    return Promise.reject(new Error('Image engine not yet initialized.'));
                }

                if (!forceRepaint && !this.engine.needsRepaint()) {
                    return Promise.reject(new Error('No repaint needed.'));
                }

                if (requestedAnimationFrame) {
                    window.cancelAnimationFrame(requestedAnimationFrame);
                    this.drawPromises.get(requestedAnimationFrame)?.reject(new Error('Repaint cancelled.'));
                    this.drawPromises.delete(requestedAnimationFrame);
                }

                const drawFn = (resolve) => {
                    this.finalImage = this.engine.draw(forceRepaint);

                    const width = this.canvasWidth;
                    const height = this.canvasHeight;
                    const offset = this.showBleed ? 0 : this.bleed;

                    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                    this.context.drawImage(this.finalImage, offset, offset, width, height, 0, 0, width, height);

                    if (this.showBleed) {
                       this.drawTrimArea();
                    }

                    this.updateTextFitsImage();
                    this.updateScaleUpLimit();

                    resolve();
                    this.drawPromises.delete(requestedAnimationFrame);
                    requestedAnimationFrame = null;
                };

                if (forceRepaint) {
                    // draw immediately to avoid draw event canceling.
                    // this is needed when the font is loaded.
                    return new Promise(res => drawFn(res));
                }

                let resolve, reject;
                const promise = new Promise((res, rej) => {
                    resolve = res;
                    reject = rej;
                });
                requestedAnimationFrame = window.requestAnimationFrame(() => drawFn(resolve));
                this.drawPromises.set(requestedAnimationFrame, {resolve, reject});

                return promise;
            },

            drawTrimArea() {
                const ctx = this.context;
                const bleed = this.bleed;

                // grey out trim area
                ctx.lineWidth = bleed;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.strokeRect(
                    bleed / 2,
                    bleed / 2,
                    this.visibleWidth + bleed,
                    this.visibleHeight + bleed
                );

                // draw trim marks
                const onePx = this.canvasWidth / this.previewDims.width;
                const trimLineLen = bleed / 3 * 2;
                ctx.lineWidth = onePx;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';

                ctx.beginPath();

                // top left
                ctx.moveTo(0, bleed);
                ctx.lineTo(trimLineLen, bleed);
                ctx.moveTo(bleed, 0);
                ctx.lineTo(bleed, trimLineLen);

                // top right
                ctx.moveTo(this.canvasWidth, bleed);
                ctx.lineTo(this.canvasWidth - trimLineLen, bleed);
                ctx.moveTo(this.canvasWidth - bleed, 0);
                ctx.lineTo(this.canvasWidth - bleed, trimLineLen);

                // bottom left
                ctx.moveTo(0, this.canvasHeight - bleed);
                ctx.lineTo(trimLineLen, this.canvasHeight - bleed);
                ctx.moveTo(bleed, this.canvasHeight);
                ctx.lineTo(bleed, this.canvasHeight - trimLineLen);

                // bottom right
                ctx.moveTo(this.canvasWidth, this.canvasHeight - bleed);
                ctx.lineTo(this.canvasWidth - trimLineLen, this.canvasHeight - bleed);
                ctx.moveTo(this.canvasWidth - bleed, this.canvasHeight);
                ctx.lineTo(this.canvasWidth - bleed, this.canvasHeight - trimLineLen);

                ctx.stroke();
            },

            setCanvasZoneLeft: debounce(function () {
                this.canvasZoneLeft = this.$refs.canvasZone
                    ? this.$refs.canvasZone.getBoundingClientRect().left
                    : 0;
            }, 100),

            setCanvasPos() {
                const pos = this.canvas.getBoundingClientRect();
                this.canvasPos.x = pos.x + window.scrollX;
                this.canvasPos.y = pos.y + window.scrollY;
                this.canvasPos.width = pos.width;
                this.canvasPos.height = pos.height;
            },

            setViewDims: debounce(function () {
                this.viewHeight = document.documentElement.clientHeight;
                this.viewWidth = document.documentElement.clientWidth;
            }, 100),

            ensureEventPosOutsideCanvas(event) {
                const leave = [
                    {axis: 'x', distance: event.pageX - this.canvasPos.x, out: this.canvasPos.x - 1},
                    {axis: 'x', distance: event.pageX - this.canvasPos.x - this.canvasPos.width, out: this.canvasPos.x + this.canvasPos.width + 1},
                    {axis: 'y', distance: event.pageY - this.canvasPos.y, out: this.canvasPos.y - 1},
                    {axis: 'y', distance: event.pageY - this.canvasPos.y - this.canvasPos.height, out: this.canvasPos.y + this.canvasPos.height + 1},
                ]
                    .map(value => {
                        value.distance = Math.abs(value.distance)
                        return value;
                    })
                    .reduce((a, b) => a.distance < b.distance ? a : b);

                return {
                    pageX: leave.axis === 'x' ? leave.out : event.pageX,
                    pageY: leave.axis === 'y' ? leave.out : event.pageY,
                };
            },

            mouseDragStart() {
                this.dragStart();
            },
            mouseMove(event) {
                this.move(event);
            },
            mouseDragStop(event) {
                this.dragStop();
                this.move(event);
            },
            mouseLeave(event) {
                this.dragStop();
                this.move(this.ensureEventPosOutsideCanvas(event));
            },
            mouseEnter(){
                this.setCanvasPos();
            },
            touchDragStart(event) {
                this.setCanvasPos();

                const touch = event.touches[0];
                this.mousePos = this.relImagePos(touch.pageX, touch.pageY);

                this.dragStart();
            },
            touchDragMove(event) {
                this.move(event.touches[0]);
            },
            touchDragStop() {
                this.dragStop();
            },

            dragStart() {
                this.dragging = true;
            },
            dragStop() {
                this.dragging = false;
            },
            move(event) {
                this.mousePos = this.relImagePos(event.pageX, event.pageY);
            },
            relImagePos(absX, absY) {
                const offset = this.showBleed ? 0 : this.bleed;
                const wRatio = this.canvasWidth / this.canvasPos.width;
                const hRatio = this.canvasHeight / this.canvasPos.height;

                return {
                    x: (absX - this.canvasPos.x) * wRatio + offset,
                    y: (absY - this.canvasPos.y) * hRatio + offset,
                };
            },

            async save() {
                if (this.engine.getBarTouching() || this.engine.getBackgroundTouching()) {
                    this.engine.mousePos = {x: -1, y: -1};
                    await this.draw(true);
                }

                this.$emit('save', {
                    canvas: this.finalImage,
                });
            },
        },

        watch: {
            logoImage(value) {
                this.engine.logoImage = value;
                this.draw().catch(console.debug);
            },
            logoType(value) {
                this.engine.logoType = value;
                this.updateLogoWidth();
                this.draw().catch(console.debug);
            },
            styleSet(value) {
                this.engine.styleSet = value;
                this.draw().catch(console.debug);
            },
            format(value) {
                this.engine.format = value;
                this.draw(true).catch(console.debug);
            },
            visibleHeight(value) {
                this.engine.bleed = this.bleed;
                this.engine.visibleHeight = value;
                this.updateLogoWidth();
                this.draw().catch(console.debug);
            },
            visibleWidth(value) {
                this.engine.bleed = this.bleed;
                this.engine.visibleWidth = value;
                this.updateLogoWidth();
                this.draw().catch(console.debug);
            },
            canvasHeight(value) {
                this.canvas.height = value;
                this.draw(true).catch(console.debug);
            },
            canvasWidth(value) {
                this.canvas.width = value;
                this.draw(true).catch(console.debug);
            },
            backgroundType(value) {
                this.engine.backgroundType = value;
                this.draw().catch(console.debug);
            },
            backgroundImage(value) {
                this.engine.backgroundImage = value;
                this.draw().catch(console.debug);
            },
            backgroundZoom(value) {
                this.engine.backgroundZoom = value;
                this.draw().catch(console.debug);
            },
            backgroundWatermarkText(value) {
                this.engine.backgroundWatermarkText = value;
                this.draw().catch(console.debug);
            },
            bars(value) {
                this.engine.bars = value;
                this.draw(true).catch(console.debug);
            },
            fontSizePercent(value) {
                this.engine.fontSizePercent = value;
                this.draw().catch(console.debug);
            },
            hasTopShadow(value) {
                this.engine.topShadow = value;
                this.draw().catch(console.debug);
            },
            hasBottomShadow(value) {
                this.engine.bottomShadow = value;
                this.draw().catch(console.debug);
            },
            hasBorder(value) {
                this.engine.hasBorder = value;
                this.draw().catch(console.debug);
            },
            copyrightText() {
                this.setCopyrightText();
                this.draw().catch(console.debug);
            },
            alignment(value) {
                this.engine.alignment = value;
                this.draw().catch(console.debug);
            },
            fontsLoaded() {
                this.draw(true).catch(console.debug);
            },
            mousePos() {
                this.engine.mousePos = this.mousePos;
                this.draw().catch(console.debug);
            },
            dragging() {
                this.engine.dragging = this.dragging;
                this.draw().catch(console.debug);
            },
            previewDims(value) {
                this.engine.previewDims = value;
            },
            bleed(value) {
                this.engine.bleed = value;
                this.draw().catch(console.debug);
            },
        }
    }
</script>

<style lang="scss" scoped>
    .o-imagery {
        @include media-breakpoint-up(lg) {
            width: 550px;
        }

        &__preview {
            background-color: $gray-600;
            padding: 0.25em 0.5em 0.125em;
            color: $white;
            user-select: none;

            @include media-breakpoint-up(lg) {
                position: fixed;
                top: 82px;
                left: 600px;
                padding: 0.5em 1em 0.25em;
            }

            @include media-breakpoint-up(xl) {
                left: calc(25vw + 600px);
                top: 3.5em;
            }
        }

        &__canvas-zone {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }

        &__canvas-loader {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        &__canvas {
            &.transparent,
            &.image {
                // https://stackoverflow.com/a/35362074
                background-image: linear-gradient(45deg, #d7d7d7 25%, transparent 25%),
                linear-gradient(-45deg, #d7d7d7 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #d7d7d7 75%),
                linear-gradient(-45deg, transparent 75%, #d7d7d7 75%);
                background-size: 20px 20px;
                background-position: 0 0, 0 10px, 10px -10px, -10px 0px;

                &.huge {
                    background: black;
                }
            }

            &.bar-touching,
            &.image-touching {
                cursor: grab;

                &.dragging {
                    cursor: grabbing !important;
                }
            }

            &.disabled {
                pointer-events: none;
                filter: saturate(30%) contrast(30%) blur(2px) brightness(120%);
            }
        }
    }
</style>
