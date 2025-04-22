<template>
    <div class="form-group">
        <label class="mb-0 d-block">{{$t('images.create.background')}}</label>
        <div class="d-flex align-items-center">
            <div class="btn-group btn-group-toggle">
                <label v-if="gradientBackgroundAvailable"
                       :class="{
                            'active': backgroundType === backgroundTypes.gradient,
                            'disabled': loading,
                       }"
                       class="btn btn-secondary btn-sm">
                    <input
                        v-model="backgroundType"
                        :value="backgroundTypes.gradient"
                        name="background"
                        type="radio"
                    >{{$t('images.create.backgroundGreen')}}
                </label>
                <label v-if="iconsBackgroundAvailable"
                       :class="{
                            'active': backgroundType === backgroundTypes.icons,
                            'disabled': loading,
                       }"
                       class="btn btn-secondary btn-sm">
                    <input
                        v-model="backgroundType"
                        :value="backgroundTypes.icons"
                        name="background"
                        type="radio"
                    >{{$t('images.create.backgroundIcons')}}
                </label>
                <label v-if="!hugeCanvas"
                       :class="{
                        'active': backgroundType === backgroundTypes.transparent,
                        'disabled': loading,
                       }"
                       class="btn btn-secondary btn-sm"
                >
                    <input
                        v-model="backgroundType"
                        :value="backgroundTypes.transparent"
                        name="background"
                        type="radio"
                    >{{$t('images.create.backgroundTransparent')}}
                </label>
                <label :class="{
                        'active': backgroundType === backgroundTypes.image,
                        'disabled': loading,
                       }"
                       class="btn btn-secondary btn-sm">
                    <input
                        v-model="backgroundType"
                        :disabled="loading"
                        :value="backgroundTypes.image"
                        name="background"
                        type="radio"
                        @click="$refs.uploader.click()"
                    >{{$t('images.create.backgroundImage')}}
                </label>
            </div>
            <div
                v-if="loading"
                class="spinner-border spinner-border-sm text-primary ml-2"
                role="status"
            >
                <span class="sr-only">Loading...</span>
            </div>
        </div>

        <div
            v-if="backgroundType === backgroundTypes.image && hugeImage"
            class="alert alert-warning mt-1"
            role="alert">
            {{$t('images.create.hugeImage', {maxWidth: hugeImageSideLenLimit, maxHeight: hugeImageSideLenLimit})}}
        </div>

        <div
            v-if="backgroundType === backgroundTypes.image && backgroundImage"
            class="form-group m-background-block__zoom"
        >
            <div
                :style="`width: ${Math.min((1-scaleUpLimit)*100, 99)}%;`"
                class="m-background-block__scale-up-zone"
            />
            <label
                class="mb-0 mt-2"
                for="image-zoom"
            >{{$t('images.create.imageZoom')}}</label>
            <input
                :max="1"
                :min="0"
                class="form-control-range"
                id="image-zoom"
                step="0.01"
                type="range"
                v-model.number="zoom"
            >
            <small
                :class="{'m-background-block__scale-up-desc--visible': zoom > scaleUpLimit}"
                class="m-background-block__scale-up-desc"
            >
                {{$t('images.create.scaleUpDesc')}}
            </small>
        </div>

        <input
            @change="setImageFromForm($event)"
            class="custom-file-input"
            ref="uploader"
            type="file"
            :accept="acceptedMimeTypes"
        >

        <div
            class="alert alert-warning mt-1"
            role="alert"
            v-if="backgroundType === backgroundTypes.image && imageTooSmall">
            {{$t('images.create.imageTooSmall')}}
        </div>
    </div>
</template>

<script>
import {BackgroundTypes, HugeImageSurfaceLimit, StyleSetTypes} from "../../service/canvas/Constants";
import SnackbarMixin from "../../mixins/SnackbarMixin";
import loadImage from "blueimp-load-image";
import {mapGetters} from "vuex";

    const mimeTypesAllowed = [
        'image/jpeg',
        'image/png',
        'image/svg',
        'image/svg+xml'
    ];

    export default {
        name: "MBackgroundBlock",
        mixins: [SnackbarMixin],

        data() {
            return {
                mimeType: null,
                backgroundTypes: BackgroundTypes,
                hugeImageSideLenLimit: Math.sqrt(HugeImageSurfaceLimit),
            }
        },

        props: {
            bgImageId: {
                type: Number,
                default: null,
                required: false,
            }
        },

        computed: {
            ...mapGetters({
                imageHeight: 'canvas/getImageHeight',
                imageWidth: 'canvas/getImageWidth',
                styleSet: 'canvas/getStyleSet',
                user: 'user/object',
                scaleUpLimit: 'canvas/getScaleUpLimit',
            }),

            backgroundType: {
                get() {
                    return this.$store.getters['canvas/getBackgroundType']
                },
                set(value) {
                    if (BackgroundTypes.image === value && !this.backgroundImage) {
                        return
                    }

                    this.$store.dispatch('canvas/setBackgroundType', value)
                }
            },

            backgroundImage: {
                get() {
                    return this.$store.getters['canvas/getBackgroundImage']
                },
                set(value) {
                    this.$store.dispatch('canvas/setBackgroundImage', value)
                }
            },

            backgroundImageId: {
                get() {
                    return this.$store.getters['canvas/getBackgroundImageId']
                },
                set(value) {
                    this.$store.dispatch('canvas/setBackgroundImageId', value)
                }
            },

            zoom: {
                get() {
                    return this.$store.getters['canvas/getBackgroundZoom']
                },
                set(value) {
                    this.$store.dispatch('canvas/setBackgroundZoom', value)
                }
            },

            loading: {
                get() {
                    return this.$store.getters['canvas/getBackgroundIsLoading']
                },
                set(value) {
                    this.$store.commit('canvas/setBackgroundIsLoading', value)
                }
            },

            imageTooSmall() {
                if (!this.backgroundImage) {
                    return false;
                }

                if (this.backgroundImage.width < this.imageWidth) {
                    return true;
                }

                if (this.backgroundImage.height < this.imageHeight) {
                    return true;
                }

                return false;
            },

            hugeImage() {
                if (!this.backgroundImage) {
                    return false;
                }

                return this.backgroundImage.width * this.backgroundImage.height > HugeImageSurfaceLimit;
            },

            hugeCanvas() {
                return this.imageWidth * this.imageHeight > HugeImageSurfaceLimit;
            },

            gradientBackgroundAvailable() {
                return this.styleSet === StyleSetTypes.green
                    || this.styleSet === StyleSetTypes.greenCentered;
            },

            iconsBackgroundAvailable() {
                return this.styleSet === StyleSetTypes.green2025
                    || this.styleSet === StyleSetTypes.green2025Centered;
            },

            acceptedMimeTypes() {
                return mimeTypesAllowed.join(',');
            },
        },

        mounted() {
            this.setWatermarkText();

            if (this.styleSet === StyleSetTypes.young) {
                this.backgroundType = BackgroundTypes.placeholder
            }

            if (this.bgImageId) {
                this.setImageFromUrl(`/api/1/files/images/${this.bgImageId}`);
            }
        },

        methods: {
            setWatermarkText() {
                const text = this.$t('images.create.placeholderWatermark', {first_name: this.user?.first_name ?? ''})
                this.$store.dispatch('canvas/setBackgroundWatermarkText', text)
            },

            setImageFromForm(event) {
                if (!event.target.files.length) {
                    return; // no file was selected
                }

                this.loading = true;

                const blob = event.target.files[0];

                if (this.mimeValidate(blob.type)) {
                    this.mimeType = blob.type;

                    this.setNoImageReuse();

                    loadImage(
                        blob,
                        image => {
                            this.onImageLoaded(image);
                            this.loading = false;
                        },
                        {orientation: true, canvas: true}
                    );
                } else {
                    this.loading = false;
                }
            },

            setImageFromUrl(url) {
                this.loading = true;
                loadImage(
                    url,
                    (resp) => {
                        if (resp instanceof Event && resp.type === 'error') {
                            this.snackErrorDismiss(
                                new Error('Failed to load image: ' + url),
                                this.$t('images.create.imageLoadError')
                            );
                        } else {
                            this.onImageLoaded(resp);
                            this.mimeType = null;
                            this.backgroundImageId = this.bgImageId;
                        }

                        this.loading = false;
                    },
                    {orientation: true, canvas: true}
                );
            },

            onImageLoaded(image) {
                this.backgroundImage = image
                this.backgroundType = BackgroundTypes.image
                this.$store.dispatch('canvas/setBackgroundImageMimeType', this.mimeType)
                this.$store.commit('legal/reset')
            },

            mimeValidate(type) {
                if (mimeTypesAllowed.indexOf(type) === -1) {
                    this.snackErrorDismiss(
                        `"${type}" is not a supported mime type.`,
                        this.$t('images.create.mimeInvalid')
                    );

                    return false;
                }

                return true;
            },

            adjustZoom(dimNew, dimOld) {
                if (!dimOld) {
                    return;
                }

                const ratio = dimNew / dimOld;
                this.zoom *= ratio;
            },

            maybeDisableTransparentBackground() {
                if (this.hugeCanvas && this.backgroundType === BackgroundTypes.transparent) {
                    if (this.styleSet === StyleSetTypes.young) {
                        this.backgroundType = BackgroundTypes.placeholder
                    } else if(this.styleSet === StyleSetTypes.green2025) {
                        this.backgroundType = BackgroundTypes.icons
                    } else {
                        this.backgroundType = BackgroundTypes.gradient;
                    }

                    this.snackErrorDismiss(
                        new Error(`Max canvas size for transparent background is: ${HugeImageSurfaceLimit}px²`),
                        this.$t('images.create.transparentBackgroundDisabled'),
                    );
                }
            },

            setNoImageReuse() {
                this.backgroundImageId = null;

                if (this.$route.params.bgImageId) {
                    // remove bgImageId from url. don't use push,
                    // as navigating back would not re-add the image
                    this.$router.replace('/');
                }
            },
        },

        watch: {
            image() {
                this.zoom = 0;
            },
            imageWidth(valueNew, valueOld) {
                this.adjustZoom(valueNew, valueOld);
                this.maybeDisableTransparentBackground();
            },
            imageHeight(valueNew, valueOld) {
                this.adjustZoom(valueNew, valueOld);
                this.maybeDisableTransparentBackground();
            },
            styleSet(valueNew) {
                const isYoungStyle = valueNew === StyleSetTypes.young;
                const isGreenStyle = valueNew === StyleSetTypes.green || valueNew === StyleSetTypes.greenCentered;
                const isGreen2025Style = valueNew === StyleSetTypes.green2025 || valueNew === StyleSetTypes.green2025Centered;

                const isGradientOrIcons = this.backgroundType === BackgroundTypes.gradient || this.backgroundType === BackgroundTypes.icons;
                const isPlaceholderOrIcons = this.backgroundType === BackgroundTypes.placeholder || this.backgroundType === BackgroundTypes.icons;
                const isPlaceholderOrGradient = this.backgroundType === BackgroundTypes.placeholder || this.backgroundType === BackgroundTypes.gradient;

                if (isYoungStyle && isGradientOrIcons) {
                    this.backgroundType = BackgroundTypes.placeholder;
                } else if (isGreenStyle && isPlaceholderOrIcons) {
                    this.backgroundType = BackgroundTypes.gradient;
                } else if (isGreen2025Style && isPlaceholderOrGradient) {
                    this.backgroundType = BackgroundTypes.icons;
                }
            },
            user() {
                this.setWatermarkText();
            },
        },
    }
</script>

<style lang="scss" scoped>
    .custom-file-input {
        display: none;
    }

    .m-background-block__zoom {
        position: relative;
    }

    .m-background-block__scale-up-desc {
        color: darkred;
        opacity: 0;
        width: 100%;
        text-align: right;
        display: block;
        transition: all 0.4s ease;
    }

    .m-background-block__scale-up-desc--visible {
        opacity: 1;
    }

    .m-background-block__scale-up-zone {
        position: absolute;
        right: 0;
        height: 8px;
        background: rgba(227, 52, 47, 0.35);
        user-select: none;
        pointer-events: none;
        top: 37.6px;
        border-radius: 0 8px 8px 0;
    }
</style>
