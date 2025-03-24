<template>
    <div v-if="! logoType && usableStyleSets.length > 1" class="form-group">
        <label class="mb-0 d-block">{{$t('images.create.styleSet')}}</label>
        <div class="btn-group btn-group-toggle">
            <label :class="{'active': isGreenStyleSet}"
               class="btn btn-secondary btn-sm">
            <input
                v-model="styleSet"
                :value="greenStyleSetButtonValue"
                name="styleSet"
                type="radio"
            >{{$t('images.create.styleSetGreen')}}
            </label>
            <label :class="{'active': isGreen2025StyleSet}"
               class="btn btn-secondary btn-sm">
            <input
                v-model="styleSet"
                :value="green2025StyleSetButtonValue"
                name="styleSet"
                type="radio"
            >{{$t('images.create.styleSetGreen2025')}}
            </label>
            <label :class="{'active': styleSet === styleSetTypes.young}"
               class="btn btn-secondary btn-sm">
            <input
                v-model="styleSet"
                :value="styleSetTypes.young"
                name="styleSet"
                type="radio"
            >{{$t('images.create.styleSetYoung')}}
            </label>
        </div>
    </div>
</template>

<script>
    import {StyleSetTypes, LogoTypes, Alignments} from "../../service/canvas/Constants";
    import {ImageSizeIds, ImageSizes} from "../../service/canvas/ImageSizes";
    import {mapGetters} from "vuex";

    export default {
        name: "MStyleSetBlock",

        data() {
            return {
                styleSetTypes: StyleSetTypes,
            }
        },

        computed: {
            ...mapGetters({
              getLogoById: 'logosUsable/getById',
              usableLogos: 'logosUsable/getAll',
              currentLogoId: 'canvas/getLogoId',
              selectedImageSize: 'canvas/getSelectedImageSize',
              logoType: 'canvas/getLogoType',
              centered: true,
            }),

            styleSet: {
                get() {
                    return this.$store.getters['canvas/getStyleSet'];
                },
                set(value) {
                    this.$store.commit('canvas/setStyleSet', value);
                },
            },

            usableLogoTypes() {
                return this.usableLogos
                    .map(logo => logo.type)
                    .filter((type, index, array) => array.indexOf(type) === index)
            },

            usableStyleSets() {
                const logoTypes = this.usableLogoTypes

                if (logoTypes.length === 0) {
                    return [
                        StyleSetTypes.green,
                        StyleSetTypes.green2025,
                        StyleSetTypes.green2025Centered,
                        StyleSetTypes.young
                    ]
                }

                return logoTypes
                  .flatMap(this.getStyleSetFromLogoType)
            },

            logoDefaultStyleSet() {
                if (!this.logoType) {
                    return null;
                }

                return this.getStyleSetFromLogoType(this.logoType)[0];
            },

            greenStyleSetButtonValue() {
                return this.selectedImageSize === ImageSizes.fbCoverGreen
                    ? StyleSetTypes.greenCentered
                    : StyleSetTypes.green;
            },

            green2025StyleSetButtonValue() {
                return this.centered
                    ? StyleSetTypes.green2025Centered
                    : StyleSetTypes.green2025;
            },

            isGreenStyleSet() {
                return this.styleSet === StyleSetTypes.green
                    || this.styleSet === StyleSetTypes.greenCentered
            },

            isGreen2025StyleSet() {
                return this.styleSet === StyleSetTypes.green2025
                    || this.styleSet === StyleSetTypes.green2025Centered
            }
        },

        methods: {
            getStyleSetFromLogoType(logoType) {
                switch (logoType) {
                    case LogoTypes["giovani-verdi"]:
                    case LogoTypes["jeunes-vert-e-s"]:
                    case LogoTypes["junge-gruene"]:
                        return [StyleSetTypes.young]

                    default:
                      return [StyleSetTypes.green, StyleSetTypes.green2025]
                }
            },

            applyCorrectStyleSet() {
                const style = this.logoDefaultStyleSet || this.styleSet;

                if (StyleSetTypes.young === style) {
                    this.styleSet = StyleSetTypes.young;
                } else if (ImageSizeIds.fbCoverGreen === this.selectedImageSize.id) {
                    this.styleSet = StyleSetTypes.greenCentered;
                } else if (StyleSetTypes.green2025 === style || StyleSetTypes.green2025Centered === style) {
                    if(this.centered) {
                        this.styleSet = StyleSetTypes.green2025Centered;
                    } else {
                        this.styleSet = StyleSetTypes.green2025;
                    }
                }
                else {
                    this.styleSet = StyleSetTypes.green;
                }
            },
        },

        mounted() {
            if (this.usableStyleSets.length === 1) {
                this.styleSet = this.usableStyleSets[0]
            }
        },

        watch: {
            logoType() {
                this.applyCorrectStyleSet();
            },

            selectedImageSize() {
                this.applyCorrectStyleSet();
            },
        },
    }
</script>

<style lang="scss" scoped>
</style>
