import {
    Alignments,
    BackgroundTypes,
    BarSchemes,
    BarTypes,
    ColorSchemes,
    Formats,
    StyleSetTypes,
    Media,
    ColorEncodings,
    PrintingBleed,
    Inch2mm
} from "../../service/canvas/Constants";
import {ImageSizes} from "../../service/canvas/ImageSizes";

const state = {
    styleSet: StyleSetTypes.green,
    alignment: Alignments.left,
    imageHeight: 0,
    imageWidth: 0,
    selectedImageSize: ImageSizes[0],
    colorSchema: ColorSchemes.white,
    logoId: null,
    logoWidth: 0,
    logoImage: null,
    logoType: null,
    centered: false,
    backgroundType: BackgroundTypes.gradient,
    backgroundImage: null,
    backgroundImageId: false,
    backgroundImageMimeType: null,
    backgroundZoom: 0,
    backgroundWatermarkText: null,
    hasBorder: true,
    fontSizePercent: 50,
    textFitsImage: true,
    hasTopShadow: true,
    hasBottomShadow: true,
    format: Formats.digital,
    rotated: false,
    fontsLoaded: false,
    copyrightText: '',
    scaleUpLimit: 1,
    backgroundIsLoading: false,
    logoIsLoading: false,
    bars: [
        {
            type: BarTypes.headline,
            schema: BarSchemes.white,
            text: 'Headline 1',
            canvas: null,
            padding: 0,
        },
        {
            type: BarTypes.headline,
            schema: BarSchemes.magenta,
            text: 'Headline 2',
            canvas: null,
            padding: 0,
        },
        {
            type: BarTypes.subline,
            schema: BarSchemes.white,
            text: 'Subline',
            canvas: null,
            padding: 0,
        },
    ],
};

const getters = {
    getStyleSet: state => state.styleSet,
    getAlignment: state => state.alignment,
    getImageHeight: state => state.imageHeight,
    getImageWidth: state => state.imageWidth,
    getSelectedImageSize: state => state.selectedImageSize,
    getColorSchema: state => state.colorSchema,
    getLogoId: state => state.logoId,
    getLogoWidth: state => state.logoWidth,
    getLogoImage: state => state.logoImage,
    getLogoType: state => state.logoType,
    getCentered: state => state.centered,
    getBackgroundType: state => state.backgroundType,
    getBackgroundImage: state => state.backgroundImage,
    getBackgroundImageId: state => state.backgroundImageId,
    getBackgroundImageMimeType: state => state.backgroundImageMimeType,
    getBackgroundZoom: state => state.backgroundZoom,
    getBackgroundWatermarkText: state => state.backgroundWatermarkText,
    getHasBorder: state => state.hasBorder,
    getFontSizePercent: state => state.fontSizePercent,
    getTextFitsImage: state => state.textFitsImage,
    getBars: state => state.bars,
    getHasTopShadow: state => state.hasTopShadow,
    getHasBottomShadow: state => state.hasBottomShadow,
    getFormat: state => state.format,
    getResolution: state => state.selectedImageSize.resolution,
    getMedia: state => state.format === Formats.digital ? Media.screen : Media.print,
    getBleed: state => Math.round(PrintingBleed * (state.selectedImageSize.resolution / Inch2mm)),
    getShowBleed: state => state.format === Formats.printProfessional,
    getColorEncoding: state => state.format === Formats.digital ? ColorEncodings.sRGB : ColorEncodings.FOGRA51,
    getRotated: state => state.rotated,
    getFontsLoaded: state => state.fontsLoaded,
    getCopyrightText: state => state.copyrightText,
    getScaleUpLimit: state => state.scaleUpLimit,
    getBackgroundIsLoading: state => state.backgroundIsLoading,
    getLogoIsLoading: state => state.logoIsLoading,
};

const mutations = {
    setStyleSet: (state, styleSet) => state.styleSet = styleSet,
    setAlignment: (state, alignment) => state.alignment = alignment,
    setImageHeight: (state, height) => state.imageHeight = height,
    setImageWidth: (state, width) => state.imageWidth = width,
    setSelectedImageSize: (state, size) => state.selectedImageSize = size,
    setColorSchema: (state, schema) => state.colorSchema = schema,
    setLogoId: (state, logoId) => state.logoId = logoId,
    setLogoWidth: (state, width) => state.logoWidth = width,
    setLogoImage: (state, image) => state.logoImage = image,
    setLogoType: (state, type) => state.logoType = type,
    setCentered: (state, value) => state.centered = value,
    setBackgroundType: (state, type) => state.backgroundType = type,
    setBackgroundImage: (state, image) => state.backgroundImage = image,
    setBackgroundImageId: (state, id) => state.backgroundImageId = id,
    setBackgroundImageMimeType: (state, mimeType) => state.backgroundImageMimeType = mimeType,
    setBackgroundZoom: (state, zoom) => state.backgroundZoom = zoom,
    setBackgroundWatermarkText: (state, text) => state.backgroundWatermarkText = text,
    setHasBorder: (state, border) => state.hasBorder = border,
    setFontSizePercent: (state, size) => state.fontSizePercent = size,
    setTextFitsImage: (state, fits) => state.textFitsImage = fits,
    addBar: (state, payload) => state.bars.splice(payload.index, 0, payload.bar),
    removeBar: (state, payload) => state.bars.splice(payload.index, 1),
    setBar: (state, payload) => state.bars.splice(payload.index, 1, payload.bar),
    setHasTopShadow: (state, shadow) => state.hasTopShadow = shadow,
    setHasBottomShadow: (state, shadow) => state.hasBottomShadow = shadow,
    setFormat: (state, format) => state.format = format,
    setRotated: (state, rotated) => state.rotated = rotated,
    setFontsLoaded: (state, loaded) => state.fontsLoaded = loaded,
    setCopyrightText: (state, text) => state.copyrightText = text,
    setScaleUpLimit: (state, limit) => state.scaleUpLimit = limit,
    setBackgroundIsLoading: (state, loading) => state.backgroundIsLoading = loading,
    setLogoIsLoading: (state, loading) => state.logoIsLoading = loading,
};

const actions = {
    setStyleSet({commit}, styleSet) {
        commit('setStyleSet', styleSet);
    },
    setAlignment({commit}, alignment) {
        commit('setAlignment', alignment)
    },
    setImageHeight({commit}, height) {
        commit('setImageHeight', height)
    },
    setImageWidth({commit}, width) {
        commit('setImageWidth', width)
    },
    setSelectedImageSize({commit}, size) {
        commit('setSelectedImageSize', size)
    },
    setColorSchema({commit}, schema) {
        commit('setColorSchema', schema)
    },
    setLogoId({commit}, logoId) {
        commit('setLogoId', logoId)
    },
    setLogoWidth({commit}, width) {
        commit('setLogoWidth', width)
    },
    setLogoImage({commit}, image) {
        commit('setLogoImage', image)
    },
    setLogoType({commit}, type) {
        commit('setLogoType', type)
    },
    setCentered({commit}, value) {
        commit('setCentered', value)
    },
    setBackgroundType({commit}, type) {
        commit('setBackgroundType', type)
    },
    setBackgroundImage({commit}, image) {
        commit('setBackgroundImage', image)
    },
    setBackgroundImageId({commit}, id) {
        commit('setBackgroundImageId', id)
    },
    setBackgroundImageMimeType({commit}, mimeType) {
        commit('setBackgroundImageMimeType', mimeType)
    },
    setBackgroundZoom({commit}, zoom) {
        commit('setBackgroundZoom', zoom)
    },
    setBackgroundWatermarkText({commit}, text) {
        commit('setBackgroundWatermarkText', text)
    },
    setHasBorder({commit}, border) {
        commit('setHasBorder', border)
    },
    setFontSizePercent({commit}, size) {
        commit('setFontSizePercent', size)
    },
    setTextFitsImage({commit}, fits) {
        commit('setTextFitsImage', fits)
    },
    addBar({commit}, payload) {
        commit('addBar', payload)
    },
    removeBar({commit}, payload) {
        commit('removeBar', payload)
    },
    setBar({commit}, payload) {
        commit('setBar', payload)
    },
    setHasTopShadow({commit}, shadow) {
        commit('setHasTopShadow', shadow)
    },
    setHasBottomShadow({commit}, shadow) {
        commit('setHasBottomShadow', shadow)
    },
    setFormat({commit}, format) {
        commit('setFormat', format)
    },
    setRotated({commit}, rotated) {
        commit('setRotated', rotated)
    },
    setFontsLoaded({commit}, loaded) {
        commit('setFontsLoaded', loaded)
    },
    setCopyrightText({commit}, text) {
        commit('setCopyrightText', text)
    },
    setScaleUpLimit({commit}, limit) {
        commit('setScaleUpLimit', limit)
    },
    setBackgroundIsLoading({commit}, loading) {
        commit('setBackgroundIsLoading', loading)
    },
    setLogoIsLoading({commit}, loading) {
        commit('setLogoIsLoading', loading)
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
