<template>
    <AFormGroup>
        <template #label>
            <label :for="id" class="col-form-label">
                {{ label }}
                <span v-if="required">*</span>
            </label>
        </template>
        <template #input>
            <input
                :id="id"
                :required="required"
                :type="type"
                :value="value"
                :class="validClass"
                :autocomplete="autocomplete"
                :disabled="disabled"
                @input="onInput"
                class="form-control">
        </template>
        <template #helptext>
            <template v-if="helptext">{{ helptext }}</template>
            <template v-if="validation && $v.value.$error">
                <div v-if="validation.messages">
                    <div v-for="(message, key) in validation.messages">
                        <span v-if="false === $v.value[key]" class="text-danger">{{ message }}</span>
                    </div>
                </div>
                <div v-else-if="validation.message">
                    <span class="text-danger">{{ validation.message }}</span>
                </div>
            </template>
        </template>
    </AFormGroup>
</template>

<script>
import SlugifyMixin from "../../mixins/SlugifyMixin";
import AFormGroup from "../atoms/AFormGroup";

export default {
    name: "AInput",
    components: {AFormGroup},
    mixins: [SlugifyMixin],
    props: {
        label: {
            required: true,
            type: String
        },
        type: {
            default: 'text',
            type: String
        },
        required: {
            default: false,
            type: Boolean
        },
        value: {
            default: '',
            type: String
        },
        validation: {
            default: null,
            type: Object
        },
        autocomplete: {
            default: 'off',
            type: String,
        },
        disabled: {
            default: false,
            type: Boolean
        },
        helptext: {
            default: null,
            type: String
        }
    },
    computed: {
        id() {
            return this.slugify(this.label)
        },
        validClass() {
            if (!this.validation) {
                return;
            }

            if (this.$v.value.$error) {
                return 'is-invalid';
            }

            if (this.$v.value.$dirty && !this.$v.value.$error) {
                return 'is-valid';
            }

            return '';
        }
    },
    validations() {
        if (this.validation) {
            return {
                value: this.validation.rules
            }
        }
    },
    methods: {
        onInput(event) {
            this.$emit('input', event.target.value);

            if (this.validation) {
                this.$v.value.$touch();
            }
        }
    },
}
</script>

<style scoped>

</style>
