<template>
    <div class="form-group">
        <label for="logo" class="mb-0 d-flex align-items-center">
            {{$t('images.create.logo')}}
            <div
                v-if="!logosReady || logoDefaultSaving"
                class="spinner-border spinner-border-sm text-primary ml-2"
                role="status">
            </div>
            <ADefaultLogo
                :ready="logosReady"
                :selectedId="logoIdSelected"
                @saved="logoDefaultSaving = false"
                @saveing="logoDefaultSaving = true"
                v-if="logoIdSelected"
            />
        </label>

        <div class="d-flex">
            <ModelSelect
                :isDisabled="loadingLogos || ! userHasLogos"
                :options="logoChoices"
                :value="logoIdSelected"
                @input="setLogo($event)"
                class="form-control flex-grow-1"
                id="logo"
                required="false"
            />
            <button
                :title="$t('images.create.logoRemove')"
                @click="setLogo(null)"
                class="btn btn-outline-secondary ml-2"
                v-if="logoIdSelected"
            >&times;
            </button>
        </div>
        <div
            v-if="! loadingLogos && ! userHasLogos"
            class="alert alert-warning"
            role="alert"
        >{{$t('images.create.userHasNoLogos')}}
        </div>
    </div>
</template>

<script>
    import SnackbarMixin from "../../mixins/SnackbarMixin";
    import {ModelSelect} from 'vue-search-select'
    import ResourceLoadMixin from "../../mixins/ResourceLoadMixin";
    import {mapGetters} from "vuex";
    import PrepareSelectMixin from "../../mixins/PrepareSelectMixin";
    import {ColorSchemes, StyleSetTypes} from "../../service/canvas/Constants";
    import ADefaultLogo from "../atoms/ADefaultLogo";

    export default {
        name: "MLogoBlock",
        components: {ADefaultLogo, ModelSelect},
        mixins: [ResourceLoadMixin, SnackbarMixin, PrepareSelectMixin],

        data() {
            return {
                logoObjSelected: null,
                logoChoices: [],
                logoDefaultSaving: false,
            }
        },

        computed: {
            ...mapGetters({
                logos: 'logosUsable/getAll',
                getLogoById: 'logosUsable/getById',
                loadingLogos: 'logosUsable/loading',
                imageHeight: 'canvas/getImageHeight',
                imageWidth: 'canvas/getImageWidth',
                colorSchema: 'canvas/getColorSchema',
                styleSet: 'canvas/getStyleSet',
                logoWidth: 'canvas/getLogoWidth',
            }),

            logoIdSelected: {
                get() {
                    return this.$store.getters['canvas/getLogoId']
                },
                set(val) {
                    return this.$store.dispatch('canvas/setLogoId', val)
                }
            },

            logoImage: {
                get() {
                    return this.$store.getters['canvas/getLogoImage']
                },
                set(val) {
                    return this.$store.dispatch('canvas/setLogoImage', val)
                }
            },

            logoType: {
                get() {
                    return this.$store.getters['canvas/getLogoType']
                },
                set(val) {
                    return this.$store.dispatch('canvas/setLogoType', val)
                }
            },

            loadingLogoImage: {
                get() {
                    return this.$store.getters['canvas/getLogoIsLoading']
                },
                set(val) {
                    return this.$store.dispatch('canvas/setLogoIsLoading', val)
                }
            },

            logoIdDefault() {
                return this.$store.getters['user/object'].default_logo;
            },

            color() {
                if (StyleSetTypes.young === this.styleSet) {
                    return 'white';
                }
                if (StyleSetTypes.green2025 === this.styleSet || StyleSetTypes.green2025Centered === this.styleSet) {
                    return 'white';
                }
                return ColorSchemes.white === this.colorSchema ? 'white' : 'green';
            },

            logosReady() {
                return !(this.loadingLogos || this.loadingLogoImage);
            },

            userHasLogos() {
                return this.logoChoices.length > 0;
            },

            logoSrc() {
                if (!this.logoObjSelected || !this.logoWidth) {
                    return null;
                }

                return this.logoObjSelected[`src_${this.color}`]+`/${this.logoWidth}`;
            },
        },

        created() {
            this.resourceLoad('logosUsable', true)
                .then(() => this.populateLogosSelect())
                .then(() => this.setLogo(this.logoIdDefault));
        },

        methods: {
            setLogo(logo) {
                this.logoIdSelected = logo;

                if (!logo) {
                    return this.removeLogo();
                }

                this.logoObjSelected = this.getLogoById(this.logoIdSelected);
                this.logoType = this.logoObjSelected.type;

                this.loadLogo();
            },

            removeLogo() {
                this.logoImage = null;
                this.logoType = null;
                this.logoObjSelected = null;
                this.loadingLogoImage = false;
            },

            loadLogo() {
                if (!this.logoSrc) {
                    return;
                }

                this.loadingLogoImage = true;

                const img = new Image();
                img.onload = () => {
                    if (img.src !== this.logoSrc) {
                        return;
                    }

                    this.logoImage = img;
                    this.loadingLogoImage = false;
                };

                img.src = this.logoSrc;
            },

            populateLogosSelect() {
                this.logoChoices = this.prepareSelectData(
                    this.logos,
                    'id',
                    'name'
                );
            },
        },

        watch: {
            logoWidth() {
                this.setLogo(this.logoIdSelected);
            },
            color() {
                this.$nextTick(() => {
                    this.setLogo(this.logoIdSelected);
                });
            },
        },
    }
</script>

<style lang="scss" scoped>
    .custom-file-input {
        display: none;
    }
</style>
