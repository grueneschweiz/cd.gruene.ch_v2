<template>
    <div v-if="!isColorSchemeHidden" class="form-group">
        <AButtonGroup
            :options="options"
            :title="$t('images.create.colorScheme')"
            v-model="scheme"
        ></AButtonGroup>
        <small v-if="scheme === schemes.greengreen"
        >{{$t('images.create.greengreenWarning')}}</small>
    </div>
</template>
<script>
import {BackgroundTypes, ColorSchemes, StyleSetTypes} from "../../service/canvas/Constants";
import AButtonGroup from "../atoms/AButtonGroup";
import {mapGetters} from "vuex";

    export default {
        name: 'MColorScheme',
        components: {AButtonGroup},
        data() {
            return {
                schemes: ColorSchemes,
                backgroundTypes: BackgroundTypes,
            }
        },
        computed: {
            ...mapGetters({
                styleSet: 'canvas/getStyleSet',
                backgroundType: 'canvas/getBackgroundType',
            }),

            scheme: {
                get() {
                    return this.$store.getters['canvas/getColorSchema']
                },
                set(val) {
                    this.$store.dispatch('canvas/setColorSchema', val)
                }
            },

            isColorSchemeHidden() {
                return this.backgroundType === BackgroundTypes.gradient
                    || this.styleSet === StyleSetTypes.green2025
                    || this.styleSet === StyleSetTypes.green2025Centered
            },

            options() {
                const options = [];

                if (StyleSetTypes.green2025 === this.styleSet
                    || StyleSetTypes.green2025Centered === this.styleSet) {

                    options.push(
                        {value: ColorSchemes.green2025, text: this.$t('images.create.green2025')}
                    );

                    return options
                }

                options.push(
                    {value: ColorSchemes.white, text: this.$t('images.create.white')},
                    {value: ColorSchemes.green, text: this.$t('images.create.green')}
                );

                if (StyleSetTypes.green === this.styleSet
                    || StyleSetTypes.greenCentered === this.styleSet) {
                    options.push(
                        {value: ColorSchemes.greengreen, text: this.$t('images.create.greengreen')}
                    );
                }

                return options
            }
        },

        watch: {
            styleSet() {
                if (StyleSetTypes.young === this.styleSet
                    && ColorSchemes.greengreen === this.scheme) {
                    this.scheme = ColorSchemes.green
                }
            },
            backgroundType(value) {
                if (BackgroundTypes.gradient === value) {
                    this.scheme = ColorSchemes.white;
                } else if (this.scheme === ColorSchemes.green) {
                    this.scheme = ColorSchemes.green;
                } else {
                    this.scheme = ColorSchemes.green2025;
                }
            },
        },
    }
</script>
