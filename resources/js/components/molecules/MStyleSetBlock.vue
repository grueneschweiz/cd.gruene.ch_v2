<template>
    <div v-if="hasMoreThanOneStyle" class="form-group">
        <label class="mb-0 d-block">{{$t('images.create.styleSet')}}</label>
        <div class="btn-group btn-group-toggle">
            <label v-if="isGreenStyleAllowed" :class="{'active': isGreenStyleSet()}"
            class="btn btn-secondary btn-sm">
            <input
                v-model="styleSet"
                :value="greenStyleSetButtonValue"
                name="styleSet"
                type="radio"
            >{{$t('images.create.styleSetGreen')}}
            </label>
            <label v-if="isGreen2025StyleAllowed" :class="{'active': isGreen2025StyleSet()}"
               class="btn btn-secondary btn-sm">
            <input
                v-model="styleSet"
                :value="green2025StyleSetButtonValue"
                name="styleSet"
                type="radio"
            >{{$t('images.create.styleSetGreen2025')}}
            </label>
            <label v-if="isYoungStyleAllowed" :class="{'active': styleSet === styleSetTypes.young}"
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
import {StyleSetTypes, LogoTypes} from "../../service/canvas/Constants";
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
              centered: 'canvas/getCentered',
            }),

            styleSet: {
                get() {
                    return this.$store.getters['canvas/getStyleSet'];
                },
                set(value) {
                    this.$store.commit('canvas/setStyleSet', value);
                },
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

            usableLogoTypes() {
                const userLogos = this.usableLogos // what logos a user is allowed to use
                    .map(logo => logo.type)
                    .filter((type, index, array) => array.indexOf(type) === index)

                // get only the selected logo type if it is set
                const selectedLogoType = this.logoType;
                if (selectedLogoType) {
                    return userLogos.filter(type => type === selectedLogoType);
                }

                return userLogos;
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

                return logoTypes.flatMap(type => this.getStyleSetFromLogoType(type))
            },

            isGreenStyleAllowed() {
                return this.usableStyleSets.includes(StyleSetTypes.green)
            },

            isGreen2025StyleAllowed() {
                return this.usableStyleSets.includes(StyleSetTypes.green2025)
            },

            isYoungStyleAllowed() {
                return this.usableStyleSets.includes(StyleSetTypes.young)
            },

            hasMoreThanOneStyle() {
                return this.usableStyleSets.length > 1
            },
        },

        methods: {
            isGreenStyleSet(styleSet = this.styleSet) {
                return styleSet === StyleSetTypes.green
                    || styleSet === StyleSetTypes.greenCentered;
            },

            isGreen2025StyleSet(styleSet = this.styleSet) {
                return styleSet === StyleSetTypes.green2025
                    || styleSet === StyleSetTypes.green2025Centered
            },

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
                const style = this.styleSet;
                if (StyleSetTypes.young === style) {
                    this.styleSet = StyleSetTypes.young;
                } else if (StyleSetTypes.green2025 === style || StyleSetTypes.green2025Centered === style) {
                    if(this.centered) {
                        this.styleSet = StyleSetTypes.green2025Centered;
                    } else {
                        this.styleSet = StyleSetTypes.green2025;
                    }
                } else if (ImageSizeIds.fbCoverGreen === this.selectedImageSize.id) {
                    this.styleSet = StyleSetTypes.greenCentered;
                } else {
                    this.styleSet = StyleSetTypes.green;
                }
            },

            getBaseStyleType(styleSet) {
                if (this.isGreenStyleSet(styleSet)) {
                    return 'green';
                } else if (this.isGreen2025StyleSet(styleSet)) {
                    return 'green2025';
                }
                return styleSet; // young or others
            },
        },

        mounted() {
            if (this.usableStyleSets.length === 1) {
                this.styleSet = this.usableStyleSets[0]
            }
        },

        watch: {
            logoType() {
                const logoStyle = this.getStyleSetFromLogoType(this.logoType);
                if (!logoStyle.includes(this.styleSet)) {
                    this.styleSet = logoStyle[0];
                }
                this.applyCorrectStyleSet(this.logoType);
            },

            selectedImageSize() {
                this.applyCorrectStyleSet();
            },

           styleSet(newValue, oldValue) {
                // Prevent loops between green2025 and green2025Centered
                if (this.getBaseStyleType(newValue) !== this.getBaseStyleType(oldValue)) {
                    this.applyCorrectStyleSet();
                }
            },
        },
    }
</script>

<style lang="scss" scoped>
</style>
