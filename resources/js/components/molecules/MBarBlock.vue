<template>
    <div>
        <div class="form-group">
            <label
                class="mb-0"
                for="font-size"
            >{{$t('images.create.fontSize')}}</label>
            <input
                v-model.number="fontSizePercent"
                :disabled="!textFitsImage"
                :max="100"
                class="form-control-range"
                id="font-size"
                step="1"
                type="range"
                :min="1"
            >
        </div>

        <div class="form-group">
            <label
                class="mb-0"
            >{{$t('images.create.bars')}}</label>

            <ABar
                v-for="idx in bars.keys()"
                :key="idx"
                :index="idx"
            />

            <button
                :class="buttonClassSubline"
                v-if="showAddSublineBtn"
                class="btn"
                @click="addSubline"
            >{{$t('images.create.sublineAdd')}}
            </button>

            <div v-if="!textFitsImage" class="alert alert-warning mt-1" role="alert">
                {{$t('images.create.tooMuchText')}}
            </div>
        </div>
    </div>
</template>

<script>
    import {mapGetters} from "vuex";
    import {
        BarSchemes,
        BarTypes,
        BackgroundTypes,
        ColorSchemes,
        StyleSetTypes,
        Alignments
    } from "../../service/canvas/Constants";
    import ABar from "../atoms/ABar";

    export default {
        name: "MBarBlock",
        components: {ABar},

        data() {
            return {
                fontSizePercentBeforeReset: 0,
            }
        },

        computed: {
            ...mapGetters({
                styleSet: 'canvas/getStyleSet',
                alignment: 'canvas/getAlignment',
                colorSchema: 'canvas/getColorSchema',
                bars: 'canvas/getBars',
                textFitsImage: 'canvas/getTextFitsImage',
                backgroundType: 'canvas/getBackgroundType',
            }),

            fontSizePercent: {
                get() {
                    return this.$store.getters['canvas/getFontSizePercent']
                },
                set(val) {
                    if (val > 0) {
                        this.$store.dispatch('canvas/setFontSizePercent', val)
                    }
                }
            },

            buttonClassSubline() {
                switch (this.colorSchema) {
                    case ColorSchemes.white:
                        return 'btn-outline-dark'
                    case ColorSchemes.greengreen:
                        return 'btn-secondary'
                    default:
                        return 'btn-outline-secondary'
                }
            },

            showAddSublineBtn() {
                return this.bars
                    .filter(bar => bar.type === BarTypes.subline)
                    .length === 0
            },

            sublineSchema() {
                if (this.styleSet === StyleSetTypes.young) {
                    return BarSchemes.transparent
                }

                return ColorSchemes.greengreen === this.colorSchema
                    ? BarSchemes.green
                    : BarSchemes.white
            },
        },

        mounted() {
            this.maybeRemoveSubline()
        },

        methods: {
            addSubline() {
                const subline = {
                    type: BarTypes.subline,
                    schema: this.sublineSchema,
                    text: 'Subline',
                    canvas: null,
                    padding: 0,
                }

                this.$store.dispatch(
                    'canvas/addBar',
                    {index: this.bars.length, bar: subline}
                )
            },

            updateBarSchemas() {
                // Handle bars based on layout and color scheme
                if (this.bars.length > 0 && this.bars[0].type === BarTypes.headline) {
                    const schema = this.getSchemaForBar(0);
                    this.$store.dispatch('canvas/setBar', {
                        index: 0,
                        bar: { ...this.bars[0], schema }
                    });
                }

                // Force the second headline to use the scheme for current layout
                if (this.bars.length > 1 && this.bars[1].type === BarTypes.headline) {
                    const schema = this.getSchemaForBar(1);
                    this.$store.dispatch('canvas/setBar', {
                        index: 1,
                        bar: { ...this.bars[1], schema }
                    });
                }

                // Handle third headline bar if present (for green layout with 3 headline bars)
                if (this.bars.length > 2 && this.bars[2].type === BarTypes.headline && 
                    !(this.styleSet === StyleSetTypes.green2025 || this.styleSet === StyleSetTypes.green2025Centered)) {
                    this.$store.dispatch('canvas/setBar', {
                        index: 2,
                        bar: { ...this.bars[2], schema: BarSchemes.magenta }
                    });
                }

                // For subline, use the computed sublineSchema which is based on current style set
                if (this.bars.length > 2 && this.bars[2].type === BarTypes.subline) {
                    this.$store.dispatch('canvas/setBar', {
                        index: 2,
                        bar: { ...this.bars[2], schema: this.sublineSchema }
                    });
                }
            },

            getSchemaForBar(index) {
                // Green2025 layout
                if (this.styleSet === StyleSetTypes.green2025 || this.styleSet === StyleSetTypes.green2025Centered) {
                    return BarSchemes.green2025;
                }

                // Young layout
                if (this.styleSet === StyleSetTypes.young) {
                    if(index === 0) {
                    return (this.colorSchema === ColorSchemes.white)
                        ? BarSchemes.white
                        : BarSchemes.green;
                    } else {
                        return BarSchemes.magenta;
                    }
                }

                // Green layout
                const backgroundRequiresGreen =
                    this.backgroundType === BackgroundTypes.transparent ||
                    this.backgroundType === BackgroundTypes.image;

                if (index === 0 || (index === 1 && this.bars.length >2 && this.bars[2].type === BarTypes.headline)) {
                    return backgroundRequiresGreen ? BarSchemes.green : BarSchemes.white;
                }

                return BarSchemes.magenta;
            },

            maybeRemoveSubline() {
                // remove sublines for style set young
                if (this.styleSet === StyleSetTypes.young) {
                    this.bars.forEach((bar, idx) => {
                        if (bar.type === BarTypes.subline && 'Subline' === bar.text) {
                            this.$store.dispatch('canvas/removeBar', {index: idx})
                        }
                    })
                }
            },

            maybeRemoveHeadline() {
                // remove third headline for style set young
                if (this.styleSet === StyleSetTypes.young) {
                    // remove first primary headline if there are two
                    const primaryHeadlines = this.bars.filter(
                        bar => bar.type === BarTypes.headline
                            && (bar.schema === BarSchemes.white ||
                                bar.schema === BarSchemes.green ||
                                bar.schema === BarSchemes.green2025)
                    );
                    if (primaryHeadlines.length > 1) {
                        this.$store.commit('canvas/removeBar', {index: 0})
                    }

                    // remove first secondary headline if there are two
                    const secondaryHeadlines = this.bars.filter(
                        bar => bar.type === BarTypes.headline
                            && (bar.schema === BarSchemes.magenta ||
                                bar.schema === BarSchemes.transparent2025)
                    );
                    if (secondaryHeadlines.length > 1) {
                        this.$store.commit('canvas/removeBar', {index: 1})
                    }
                }
            },

            maybeAddHeadline() {
                // Green and young layouts need at least 2 headline bars
                if ((this.styleSet !== StyleSetTypes.green2025 &&
                     this.styleSet !== StyleSetTypes.green2025Centered) &&
                     this.bars.filter(bar => bar.type === BarTypes.headline).length === 1) {

                    const secondHeadline = {
                        type: BarTypes.headline,
                        schema: BarSchemes.magenta,
                        text: 'Headline',
                        canvas: null,
                        padding: 0,
                    };

                    this.$store.dispatch(
                        'canvas/addBar',
                        {index: 1, bar: secondHeadline}
                    );
                }
            }
        },

        watch: {
            styleSet() {
                this.maybeRemoveSubline();
                this.maybeRemoveHeadline();
                this.maybeAddHeadline();

                // Handle alignment based on style set
                const currentAlignment = this.$store.getters['canvas/getAlignment'];

                if ((this.styleSet === StyleSetTypes.green || this.styleSet === StyleSetTypes.green2025) &&
                    currentAlignment !== Alignments.left) {
                    this.$store.dispatch('canvas/setAlignment', Alignments.left);
                } else if (this.styleSet === StyleSetTypes.greenCentered ||
                          this.styleSet === StyleSetTypes.green2025Centered ||
                          this.styleSet === StyleSetTypes.young) {
                    this.$store.dispatch('canvas/setAlignment', Alignments.center);
                }

                this.$nextTick(() => {
                    this.updateBarSchemas();
                });
            },
            colorSchema() {
                this.$nextTick(() => {
                    this.updateBarSchemas();
                });
            },
            textFitsImage(val) {
                if (!val) {
                    this.fontSizePercentBeforeReset = this.fontSizePercent
                    this.fontSizePercent = 1
                } else {
                    this.fontSizePercent = this.fontSizePercentBeforeReset
                }
            },
        }
    }
</script>

<style scoped>

</style>
