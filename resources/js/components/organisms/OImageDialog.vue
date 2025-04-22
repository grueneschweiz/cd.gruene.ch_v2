<template>
    <ODialog
        :title="$t('images.create.generating')"
        @close="$emit('close', $event)"
    >
        <p v-if="uploadStatus < 100">
            {{$t('images.create.waitPlease')}}
            <span v-if="showLegalCheck && !legalFormHidden">{{$t('images.create.legal.announce')}}</span>
        </p>

        <div class="progress" v-if="uploadStatus < 100 && (!showLegalCheck || legalFormHidden)">
            <div
                :aria-valuenow="uploadStatus"
                aria-valuemax="100"
                aria-valuemin="0"
                :style="`width: ${uploadStatus}%`"
                class="progress-bar"
                role="progressbar"
            >{{Math.round(uploadStatus)}}%
            </div>
        </div>

        <MLegalForm
            :imageUpload="uploadPromise"
            @completed="onLegalUploadCompleted"
            @saving="legalFormHidden = true"
            v-if="showLegalCheck"
            v-show="!legalFormHidden"
        />

        <a
            :download="filenameDownload"
            :href="downloadLink"
            @click=" $emit('close')"
            class="btn btn-primary"
            v-if="downloadReady && !showLegalCheck"
        >{{$t('images.create.imageDownload')}}
        </a>
    </ODialog>
</template>

<script>
import {
    BackgroundTypes,
    Formats,
    HugeImageJpegQuality,
    HugeImageSurfaceLimit,
    Media, RegularImageQuality
} from "../../service/canvas/Constants";
    import Api from "../../service/Api";
    import ImageUpload from "../../service/ImageUpload";
    import SnackbarMixin from "../../mixins/SnackbarMixin";
    import ODialog from "../organisms/ODialog";
    import MLegalForm from "../molecules/MLegalForm";
    import UnauthorizedHandlerMixin from "../../mixins/UnauthorizedHandlerMixin";
    import {mapGetters} from "vuex";

    const metaUploadProgress = 5;
    const legalUploadProgress = 5;
    const imageProcessingProgress = 10;

    export default {
        name: "OImageDialog",
        components: {MLegalForm, ODialog},
        mixins: [SnackbarMixin, UnauthorizedHandlerMixin],


        data() {
            return {
                uploadRawStatus: 0,
                uploadFinalStatus: 0,
                uploadMetaStatus: 0,
                uploadLegalStatus: 0,
                imageProcessingStatus: 0,
                downloadReady: false,
                showLegalCheck: false,
                uploadPromise: null,
                resolveUpload: null,
                legalFormHidden: false,
                finalImageSrc: null,
            }
        },


        props: {
            imageData: {
                required: true,
                type: Object
            }
        },


        computed: {
            ...mapGetters({
                logoId: 'canvas/getLogoId',
                rawImage: 'canvas/getBackgroundImage',
                rawImageMimeType: 'canvas/getBackgroundImageMimeType',
                backgroundType: 'canvas/getBackgroundType',
                bleed: 'canvas/getBleed',
                colorEncoding: 'canvas/getColorEncoding',
                resolution: 'canvas/getResolution',
                media: 'canvas/getMedia',
                format: 'canvas/getFormat',
            }),

            backgroundImageId: {
                get() {
                    return this.$store.getters['canvas/getBackgroundImageId']
                },
                set(value) {
                    this.$store.dispatch('canvas/setBackgroundImageId', value)
                }
            },

            keywords() {
                return this.$store.getters['canvas/getBars']
                    .map(bar => bar.text)
                    .reduce((concatenated, barText) => concatenated + ' ' + barText, '')
                    .trim()
            },

            hasRawImage() {
                return this.backgroundType === BackgroundTypes.image
                    && this.rawImage
                    && !this.backgroundImageId;
            },

            uploadImagesTotalWeight() {
                const uploadComplete = 100;
                const imageCount = this.hasRawImage ? 2 : 1;
                const nonImageProgress = this.hasRawImage
                    ? imageCount * metaUploadProgress + legalUploadProgress
                    : metaUploadProgress;

                return uploadComplete - nonImageProgress - imageProcessingProgress;
            },

            uploadRawWeight() {
                if (!this.hasRawImage) {
                    return 0;
                }

                const raw = this.rawImageDataUrl.length;
                const final = this.finalImageDataUrl.length;

                return this.uploadImagesTotalWeight * raw / (raw + final);
            },

            uploadFinalWeight() {
                return this.uploadImagesTotalWeight - this.uploadRawWeight;
            },

            rawImageExportFormat() {
                return 'image/jpeg' === this.rawImageMimeType || this.isHuge(this.rawImage)
                    ? 'image/jpeg'
                    : 'image/png';
            },

            rawImageExtension() {
                return this.getFileExtensionFromMimeType(this.rawImageExportFormat);
            },

            rawImageDataUrl() {
                const quality = this.getJpegQuality(this.rawImage);
                return this.rawImage.toDataURL(this.rawImageExportFormat, quality);
            },

            finalImageFormat() {
                return this.isHuge(this.imageData.canvas, this.bleed) ? 'image/jpeg' : 'image/png';
            },

            finalImageDataUrl() {
                const quality = this.getJpegQuality(this.imageData.canvas, this.bleed);
                return this.imageData.canvas.toDataURL(this.finalImageFormat, quality);
            },

            uploadStatus() {
                return this.uploadRawStatus * this.uploadRawWeight
                    + this.uploadFinalStatus * this.uploadFinalWeight
                    + this.uploadMetaStatus * metaUploadProgress
                    + this.uploadLegalStatus * legalUploadProgress
                    + this.imageProcessingStatus * imageProcessingProgress;
            },

            downloadLink() {
                if (!this.finalImageSrc) {
                    return null;
                }

                const url = new URL(this.finalImageSrc);
                url.searchParams.append('format', this.downloadImageFileExtension);
                url.searchParams.append('color_profile', this.colorEncoding);
                url.searchParams.append('bleed', this.format === Formats.printProfessional ? '1' : '0');

                if (Media.print === this.media) {
                    url.searchParams.append('resolution', this.resolution);
                }

                return url.href
            },

            filenameDownload() {
                return `image.${this.downloadImageFileExtension}`;
            },

            finalImageFileExtension() {
                return this.getFileExtensionFromMimeType(this.finalImageFormat);
            },

            downloadImageFileExtension() {
                if (this.format === Formats.digital) {
                    return this.finalImageFileExtension;
                }

                return 'pdf';
            }
        },

        created() {
            this.uploadPromise = new Promise(res => this.resolveUpload = res);
        },

        mounted() {
            this.save();
        },


        methods: {
            isHuge(canvas, bleed = 0) {
                const visibleSurface = (canvas.width - 2 * bleed) * (canvas.height - 2 * bleed);
                return visibleSurface > HugeImageSurfaceLimit;
            },

            getFileExtensionFromMimeType(mimeString) {
                switch (mimeString) {
                    case 'image/jpeg':
                        return 'jpeg'
                    case 'image/png':
                    default:
                        return 'png'
                }
            },

            getJpegQuality(canvas, bleed = 0) {
                return this.isHuge(canvas, bleed) ? HugeImageJpegQuality : RegularImageQuality;
            },

            save() {
                this.imageData.filename = this.uniqueFilename();
                let upload;

                if (this.hasRawImage) {
                    this.showLegalCheck = true;
                    upload = this.uploadRawImage()
                        .then(() => this.resolveUpload(this.imageData.originalId))
                        .then(() => this.uploadFinalImage());
                } else {
                    upload = this.uploadFinalImage();
                }

                upload.then(() => this.processImage())
                    .then(() => this.setImageReuse())
                    .then(() => this.downloadButtonShow());
            },

            uploadRawImage() {
                this.imageData.filenameRaw = `raw-${this.imageData.filename}.${this.rawImageExtension}`;

                const image = this.rawImageDataUrl;
                const filename = this.imageData.filenameRaw;
                const uploader = new ImageUpload(image, filename);

                uploader.subscribe(status => this.uploadRawStatus = status);

                return uploader.upload('files/images')
                    .then(() => this.uploadRawImageMeta())
                    .catch(error => {
                        if (error.response?.data?.errors?.base64data?.[0] === 'Max file size exceeded.') {
                            this.snackErrorDismiss(error, this.$t('images.create.maxFileSizeExceededRaw'));
                            return;
                        }

                        this.snackErrorRetry(error, this.$t('images.create.uploadFailed'))
                            .then(this.uploadRawImage);
                    });
            },

            uploadFinalImage() {
                this.imageData.filenameFinal = `final-${this.imageData.filename}.${this.finalImageFileExtension}`;

                const image = this.finalImageDataUrl;
                const filename = this.imageData.filenameFinal;
                const uploader = new ImageUpload(image, filename);

                uploader.subscribe(status => this.uploadFinalStatus = status);

                return uploader.upload('files/images')
                    .then(() => this.uploadFinalImageMeta())
                    .catch(error => {
                        if (error.response?.data?.errors?.base64data?.[0] === 'Max file size exceeded.') {
                            this.snackErrorDismiss(error, this.$t('images.create.maxFileSizeExceededFinal'));
                            return;
                        }

                        this.snackErrorRetry(error, this.$t('images.create.uploadFailed'))
                            .then(this.uploadFinalImage);
                    });
            },

            uniqueFilename() {
                this.$store.dispatch('counter/increment');
                return this.$store.getters['counter/get'];
            },

            uploadFinalImageMeta() {
                let originalId;

                if (this.backgroundImageId && this.backgroundType === BackgroundTypes.image) {
                    originalId = this.backgroundImageId;
                } else {
                    originalId = this.imageData.originalId;
                }

                const payload = {
                    logo_id: this.logoId,
                    background: this.backgroundType,
                    type: 'final',
                    original_id: originalId,
                    filename: this.imageData.filenameFinal,
                    keywords: this.keywords,
                    bleed: this.bleed,
                    resolution: this.resolution,
                };

                const cb = resp => this.finalImageSrc = resp.data.src;

                return this.uploadImageMeta(payload, cb);
            },

            processImage() {
                if (!this.finalImageSrc) {
                    return Promise.reject(new Error('Image source not available yet'));
                }

                // trigger a download to process the image on the server
                // it will cache processed image server sides and dramatically
                // increase ux when clicking the download button.
                //
                // the response here is discarded.
                return Api().get(this.downloadLink)
                    .then(() => this.imageProcessingStatus = 1)
                    .catch(error => this.handleUnauthorized(error))
                    .catch(error => {
                        this.snackErrorRetry(error, this.$t('images.create.processingFailed'))
                            .then(() => this.processImage());
                    });
            },

            uploadRawImageMeta() {
                const payload = {
                    background: this.backgroundType,
                    type: 'raw',
                    filename: this.imageData.filenameRaw,
                    keywords: this.keywords,
                };

                const cb = resp => this.imageData.originalId = resp.data.id;

                return this.uploadImageMeta(payload, cb);
            },

            uploadImageMeta(payload, successCallback = null) {
                return Api().post('images', payload)
                    .then(resp => {
                        if (successCallback instanceof Function) {
                            return successCallback(resp);
                        } else {
                            return resp;
                        }
                    })
                    .then(() => this.uploadMetaStatus++)
                    .catch(error => this.handleUnauthorized(error))
                    .catch(error => {
                        this.snackErrorRetry(error, this.$t('images.create.uploadFailed'))
                            .then(() => this.uploadImageMeta(payload));
                    });
            },

            setImageReuse() {
                if (this.backgroundType === BackgroundTypes.image && this.imageData.originalId) {
                    this.backgroundImageId = this.imageData.originalId;
                }
            },

            downloadButtonShow() {
                this.downloadReady = true;
            },

            onLegalUploadCompleted() {
                this.uploadLegalStatus = 1;
                this.showLegalCheck = false;
                this.legalFormHidden = false;
            },
        }
    }
</script>

<style scoped>

</style>
