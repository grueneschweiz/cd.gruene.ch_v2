import * as Snackbar from "../service/Snackbar";

export default {
    methods: {

        handleUnauthorized(error) {
            if ([401, 419].includes(error.response?.status)) {
                console.error(error);

                const snackbar = new Snackbar.Snackbar(
                    this.$t('snackbar.unauthorized'),
                    Snackbar.ERROR,
                    this.$t('snackbar.login')
                );

                return this.$store.dispatch('snackbar/push', snackbar)
                    .then(() => {
                        window.location.href = '/';
                        return new Promise(() => {});
                    });
            }

            throw error;
        },

    }
}
