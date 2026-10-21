import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function exported(values) {
    return new vm.SyntheticModule(Object.keys(values), function () {
        for (const [name, value] of Object.entries(values)) {
            this.setExport(name, value);
        }
    });
}

async function loadComponents(api) {
    const modules = new Map();
    const apiModule = exported({default: () => api});

    async function load(filename) {
        if (modules.has(filename)) {
            return modules.get(filename);
        }

        let source = fs.readFileSync(new URL(`../../${filename}`, import.meta.url), 'utf8');
        if (filename.endsWith('.vue')) {
            source = source.match(/<script>([\s\S]*?)<\/script>/)[1];
        }

        const module = new vm.SourceTextModule(source, {identifier: filename});
        modules.set(filename, module);
        await module.link(specifier => {
            if (specifier.endsWith('/Api')) {
                return apiModule;
            }
            if (specifier.endsWith('/ImageUpload')) {
                return load('resources/js/service/ImageUpload.js');
            }
            if (specifier.endsWith('/Constants')) {
                return exported({
                    BackgroundTypes: {image: 'custom'},
                    Formats: {},
                    HugeImageJpegQuality: 0.8,
                    HugeImageSurfaceLimit: 100000000,
                    Media: {},
                    RegularImageQuality: 0.9,
                });
            }
            if (specifier === 'vuex') {
                return exported({mapGetters: () => ({})});
            }
            if (specifier === 'vuelidate/lib/validators') {
                return exported(Object.fromEntries(
                    ['required', 'maxLength', 'url', 'requiredIf', 'requiredUnless']
                        .map(name => [name, () => true])
                ));
            }
            return exported({default: {}});
        });
        await module.evaluate();
        return module;
    }

    return {
        dialog: (await load('resources/js/components/organisms/OImageDialog.vue')).namespace.default,
        form: (await load('resources/js/components/molecules/MLegalForm.vue')).namespace.default,
    };
}

function deferred() {
    let resolve;
    const promise = new Promise(callback => resolve = callback);
    return {promise, resolve};
}

const flush = () => new Promise(setImmediate);

async function fixture({photo = true, failures = {}} = {}) {
    const requests = [];
    const notices = [];
    const events = [];
    const api = {
        post(endpoint, payload) {
            requests.push({method: 'POST', endpoint, payload});
            const stage = endpoint === 'files/images'
                ? (payload.filename.startsWith('raw-') ? 'rawUpload' : 'finalUpload')
                : endpoint === 'images' ? `${payload.type}Meta` : 'legal';
            const error = failures[stage]?.shift();
            if (error) {
                return Promise.reject(error);
            }
            return Promise.resolve({data: {id: 123, src: 'https://example.test/image.png'}});
        },
        get(endpoint) {
            requests.push({method: 'GET', endpoint});
            const error = failures.processing?.shift();
            return error ? Promise.reject(error) : Promise.resolve({data: {}});
        },
    };
    const definitions = await loadComponents(api);
    const context = {
        $t: message => message,
        $emit: event => events.push(event),
        handleUnauthorized(error) { throw error; },
        snackErrorRetry(error, message) {
            const retry = deferred();
            notices.push({error, message, retry});
            return retry.promise;
        },
        snackErrorDismiss(error, message) {
            notices.push({error, message});
        },
    };
    const dialog = {
        ...definitions.dialog.data(), ...context,
        imageData: {}, hasRawImage: photo,
        rawImageDataUrl: 'data:image/png;base64,AA==', rawImageExtension: 'png',
        finalImageDataUrl: 'data:image/png;base64,AA==', finalImageFileExtension: 'png',
        backgroundType: photo ? 'custom' : 'gradient', backgroundImageId: null,
        logoId: null, keywords: '', bleed: 0, resolution: 72,
        downloadLink: 'https://example.test/image.png',
    };
    for (const [name, method] of Object.entries(definitions.dialog.methods)) {
        dialog[name] = method.bind(dialog);
    }
    dialog.uniqueFilename = () => 'regression';
    definitions.dialog.created.call(dialog);

    const form = {
        ...context, imageUpload: dialog.uploadPromise, saving: false,
        payload: {originator_type: 'agency', originator: 'Photographer', shared: false},
        $emit(event) {
            events.push(event);
            if (event === 'completed') {
                dialog.onLegalUploadCompleted();
            } else if (event === 'saving') {
                dialog.legalFormHidden = true;
            }
        },
    };
    for (const [name, method] of Object.entries(definitions.form.methods)) {
        form[name] = method.bind(form);
    }
    form.validate = () => true;
    return {dialog, form, requests, notices, events};
}

test('photo saves use the uploaded original ID for legal information', async () => {
    const {dialog, form, requests, notices} = await fixture();
    const saving = dialog.save();
    await Promise.all([saving, form.submit()]);
    assert.ok(requests.some(request => request.endpoint === 'images/123/legal'));
    assert.equal(dialog.downloadReady, true);
    assert.equal(dialog.showLegalCheck, false);
    assert.deepEqual(notices, []);
});

for (const stage of ['rawUpload', 'rawMeta']) {
    test(`${stage} failure blocks final and legal saves until retry succeeds`, async () => {
        const {dialog, form, requests, notices} = await fixture({failures: {
            [stage]: [{response: {status: 500}}],
        }});
        const saving = dialog.save();
        const legalSaving = form.submit();
        await flush();
        assert.equal(notices.length, 1);
        assert.ok(!requests.some(request => request.endpoint.endsWith('/legal')));
        assert.ok(!requests.some(request => request.payload?.filename?.startsWith('final-')));
        assert.equal(dialog.downloadReady, false);
        notices[0].retry.resolve();
        await Promise.all([saving, legalSaving]);
        assert.equal(dialog.imageData.originalId, 123);
        assert.ok(requests.some(request => request.endpoint === 'images/123/legal'));
        assert.equal(dialog.downloadReady, true);
    });
}

for (const stage of ['finalUpload', 'finalMeta', 'processing']) {
    test(`${stage} failure blocks bars-only downloads until retry succeeds`, async () => {
        const {dialog, requests, notices} = await fixture({photo: false, failures: {
            [stage]: [{response: {status: 500}}],
        }});
        const saving = dialog.save();
        await flush();
        assert.equal(dialog.downloadReady, false);
        assert.equal(notices.length, 1);
        notices[0].retry.resolve();
        await saving;
        assert.equal(dialog.finalImageSrc, 'https://example.test/image.png');
        assert.equal(dialog.imageProcessingStatus, 1);
        assert.equal(dialog.downloadReady, true);
        assert.ok(!requests.some(request => request.endpoint.endsWith('/legal')));
    });
}

for (const photo of [true, false]) {
    test(`oversized ${photo ? 'raw' : 'final'} uploads stop without cascading errors`, async () => {
        const stage = photo ? 'rawUpload' : 'finalUpload';
        const {dialog, form, requests, notices, events} = await fixture({photo, failures: {
            [stage]: [{response: {status: 422, data: {errors: {
                base64data: ['Max file size exceeded.'],
            }}}}],
        }});
        const saving = dialog.save();
        if (photo) {
            form.submit();
        }
        await saving;
        await flush();
        assert.equal(notices.length, 1);
        assert.equal(notices[0].message, `images.create.maxFileSizeExceeded${photo ? 'Raw' : 'Final'}`);
        assert.equal(dialog.downloadReady, false);
        assert.deepEqual(events.filter(event => event === 'close'), ['close']);
        assert.ok(!requests.some(request => request.endpoint === 'images' || request.endpoint.endsWith('/legal')));
    });
}

test('legal retries remain pending and retain the valid image ID', async () => {
    const {form, requests, notices, events} = await fixture({failures: {
        legal: [{response: {status: 500}}],
    }});
    form.saving = true;
    const saving = form.save(123);
    await flush();
    assert.equal(form.saving, true);
    assert.ok(!events.includes('completed'));
    notices[0].retry.resolve();
    await saving;
    assert.equal(form.saving, false);
    assert.equal(events.filter(event => event === 'completed').length, 1);
    assert.ok(requests.every(request => request.endpoint === 'images/123/legal'));
});

test('legal saving never posts a missing image ID', async () => {
    const {form, requests} = await fixture();
    for (const imageId of [undefined, null, 0]) {
        form.saving = true;
        await form.save(imageId);
        assert.equal(form.saving, false);
    }
    assert.deepEqual(requests, []);
});