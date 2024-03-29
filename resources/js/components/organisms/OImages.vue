<template>
    <div class="o-images">
        <div class="d-flex align-items-center">
            <h3>{{title}}</h3>
            <div
                v-if="loadingInitial"
                class="spinner-border text-primary ml-3"
                role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>

        <div
            v-if="!loadingInitial"
            class="o-images__grid"
            v-masonry
            transition-duration="0.3s"
            item-selector=".o-images__image"
        >
            <MImage
                v-masonry-tile
                class="o-images__image"
                v-for="(image, idx) in images"
                :data="image"
                :key="idx"
                :showDetails="open === idx"
                :viewWidth="viewWidth"
                @opened="open = idx"
                @removed="removeImage(idx)"
            />
        </div>

        <div style="clear:both"></div>

        <a-loader v-if="appending"></a-loader>


    </div>
</template>

<script>
    import Api from "../../service/Api";
    import MImage from "../molecules/MImage";
    import SnackbarMixin from "../../mixins/SnackbarMixin";
    import ALoader from "../atoms/ALoader";
    import UnauthorizedHandlerMixin from "../../mixins/UnauthorizedHandlerMixin";
    import debounce from "lodash/debounce";

    const scrollMargin = 2000;

    export default {
        name: "OImages",
        components: {ALoader, MImage},
        mixins: [SnackbarMixin, UnauthorizedHandlerMixin],

        data() {
            return {
                images: [],
                data: null,
                loadingInitial: true,
                appending: false,
                open: null,
                viewWidth: document.documentElement.clientWidth,
            }
        },

        props: {
            endpoint: {type: String, required: true},
        },

        computed: {
            title() {
                if (this.loadingInitial) {
                    return this.$t('images.gallery.loading');
                }

                if (this.filtered) {
                    return this.$tc(
                        'images.gallery.searchTitle',
                        this.data.total,
                        {number: this.data.total}
                    );
                }

                return this.$tc(
                    'images.gallery.imageCount',
                    this.data.total,
                    {number: this.data.total}
                );
            },

            filtered() {
                if (!this.$route.query.q) {
                    return false;
                }

                return this.$route.query.q.length > 0;
            },

            isLastPage() {
                if (!this.data) {
                    return true;
                }

                return this.data.current_page === this.data.last_page;
            },

            pageCount() {
                if (!this.data) {
                    return 0;
                }

                return Math.ceil(this.data.total / this.data.per_page);
            },

            currentPage() {
                if (!this.data) {
                    return 1;
                }

                return this.data.current_page;
            },

            nextPage() {
                return this.pageCount > this.currentPage
                    ? this.currentPage + 1
                    : this.currentPage;
            },
        },

        methods: {
            loadImages() {
                this.loadingInitial = true;
                Api().get(this.endpoint)
                    .then(resp => this.data = resp.data)
                    .then(data => this.images = data.data)
                    .catch(error => this.handleUnauthorized(error))
                    .catch(error =>
                        this.snackErrorRetry(error, this.$t('images.gallery.loadingFailed'))
                            .then(this.loadImages)
                    )
                    .finally(() => {
                        this.onScroll();
                        window.addEventListener('scroll', this.onScroll);
                        this.loadingInitial = false;
                    });
            },

            loadMoreImages() {
                this.appending = true;
                Api().get(this.endpoint + "?page=" + this.nextPage)
                    .then(resp => this.data = resp.data)
                    .then(data => this.images.push(...data.data))
                    .catch(error => this.handleUnauthorized(error))
                    .catch(error =>
                        this.snackErrorRetry(error, this.$t('images.gallery.loadingFailed'))
                            .then(this.loadImages)
                    )
                    .finally(() => this.appending = false);

            },

            onScroll() {
                const absWindowBottom = document.documentElement.scrollTop + window.innerHeight;
                const documentHeight = document.documentElement.offsetHeight;
                const shouldLoadMore = absWindowBottom + scrollMargin > documentHeight;

                if (shouldLoadMore && !this.isLastPage && !this.appending) {
                    this.loadMoreImages();
                }
            },

            removeImage(idx) {
                this.images.splice(idx, 1);
                this.open = null;
            },

            setViewWidth() {
                this.viewWidth = document.documentElement.clientWidth;
            },
        },

        created() {
            this.loadImages();
            this.$store.dispatch('users/load');
            window.addEventListener('resize', this.setViewWidth);
        },

        beforeDestroy() {
            window.removeEventListener('scroll', this.onScroll);
            window.removeEventListener('resize', this.setViewWidth.bind(this));
        },

        watch: {
            endpoint() {
                this.loadImages();
            }
        }
    }
</script>

<style lang="scss" scoped>
    .o-images {
        &__grid {
            width: 100%;
        }
    }
</style>
