import {Inch2mm, Media, StyleSetTypes} from "./Constants";

export const ImageSizeIds = {
    square: 'square',
    fbTimeline: 'fbTimeline',
    fbCoverGreen: 'fbCoverGreen',
    fbCoverYoung: 'fbCoverYoung',
    fbEvent: 'fbEvent',
    fbWebsite: 'fbWebsite',
    video: 'video',
    twFeed: 'twFeed',
    instaStory: 'instaStory',
    customScreen: 'customScreen',
    a6: 'A6',
    a5: 'A5',
    a4: 'A4',
    a3: 'A3',
    a2: 'A2',
    a1: 'A1',
    a0: 'A0',
    f4: 'F4',
    f200: 'F200',
    f12: 'F12',
    customPrint: 'customPrint',
};

export const ImageSizes = [
    {
        id: ImageSizeIds.square,
        width: 1080,
        height: 1080,
        resolution: null,
        labelKey: 'images.create.sizes.square',
        excludeStyleSets: [],
        media: Media.screen,
        rotatable: false,
    },
    {
        id: ImageSizeIds.fbTimeline,
        width: 1200,
        height: 630,
        resolution: null,
        labelKey: 'images.create.sizes.fbTimeline',
        excludeStyleSets: [],
        media: Media.screen,
        rotatable: false,
    },
    {
        id: ImageSizeIds.fbCoverGreen,
        width: 851,
        height: 315,
        resolution: null,
        labelKey: 'images.create.sizes.fbCoverGreen',
        excludeStyleSets: [StyleSetTypes.young],
        media: Media.screen,
        rotatable: false,
    },
    {
        id: ImageSizeIds.fbCoverYoung,
        width: 851,
        height: 315,
        resolution: null,
        labelKey: 'images.create.sizes.fbCover',
        excludeStyleSets: [StyleSetTypes.green, StyleSetTypes.greenCentered],
        media: Media.screen,
        rotatable: false,
    },
    {
        id: ImageSizeIds.fbEvent,
        width: 1920,
        height: 1005,
        resolution: null,
        labelKey: 'images.create.sizes.fbEvent',
        excludeStyleSets: [],
        media: Media.screen,
        rotatable: false,
    },
    {
        id: ImageSizeIds.fbWebsite,
        width: 1200,
        height: 628,
        resolution: null,
        labelKey: 'images.create.sizes.fbWebsite',
        excludeStyleSets: [],
        media: Media.screen,
        rotatable: false,
    },
    {
        id: ImageSizeIds.video,
        width: 1920,
        height: 1080,
        resolution: null,
        labelKey: 'images.create.sizes.video',
        excludeStyleSets: [],
        media: Media.screen,
        rotatable: false,
    },
    {
        id: ImageSizeIds.twFeed,
        width: 1600,
        height: 900,
        resolution: null,
        labelKey: 'images.create.sizes.twFeed',
        excludeStyleSets: [],
        media: Media.screen,
        rotatable: false,
    },
    {
        id: ImageSizeIds.instaStory,
        width: 1080,
        height: 1920,
        resolution: null,
        labelKey: 'images.create.sizes.instaStory',
        excludeStyleSets: [],
        media: Media.screen,
        rotatable: false,
    },
    {
        id: ImageSizeIds.customScreen,
        width: null,
        height: null,
        resolution: null,
        labelKey: 'images.create.sizes.custom',
        excludeStyleSets: [],
        media: Media.screen,
        rotatable: true,
    },
    {
        id: ImageSizeIds.a6,
        width: 105 * 300 / Inch2mm,
        height: 148 * 300 / Inch2mm,
        resolution: 300,
        labelKey: 'images.create.sizes.a6',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: true,
    },
    {
        id: ImageSizeIds.a5,
        width: 148 * 300 / Inch2mm,
        height: 210 * 300 / Inch2mm,
        resolution: 300,
        labelKey: 'images.create.sizes.a5',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: true,
    },
    {
        id: ImageSizeIds.a4,
        width: 210 * 300 / Inch2mm,
        height: 297 * 300 / Inch2mm,
        resolution: 300,
        labelKey: 'images.create.sizes.a4',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: true,
    },
    {
        id: ImageSizeIds.a3,
        width: 297 * 300 / Inch2mm,
        height: 420 * 300 / Inch2mm,
        resolution: 300,
        labelKey: 'images.create.sizes.a3',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: true,
    },
    {
        id: ImageSizeIds.a2,
        width: 420 * 300 / Inch2mm,
        height: 594 * 300 / Inch2mm,
        resolution: 300,
        labelKey: 'images.create.sizes.a2',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: true,
    },
    {
        id: ImageSizeIds.a1,
        width: 594 * 300 / Inch2mm,
        height: 841 * 300 / Inch2mm,
        resolution: 300,
        labelKey: 'images.create.sizes.a1',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: true,
    },
    {
        id: ImageSizeIds.a0,
        width: 841 * 300 / Inch2mm,
        height: 1189 * 300 / Inch2mm,
        resolution: 300,
        labelKey: 'images.create.sizes.a0',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: true,
    },
    {
        id: ImageSizeIds.f4,
        width: 895 * 150 / Inch2mm,
        height: 1280 * 150 / Inch2mm,
        resolution: 150,
        labelKey: 'images.create.sizes.f4',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: false,
    },
    {
        id: ImageSizeIds.f200,
        width: 1165 * 150 / Inch2mm,
        height: 1700 * 150 / Inch2mm,
        resolution: 150,
        labelKey: 'images.create.sizes.f200',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: false,
    },
    {
        id: ImageSizeIds.f12,
        width: 2685 * 150 / Inch2mm,
        height: 1280 * 150 / Inch2mm,
        resolution: 150,
        labelKey: 'images.create.sizes.f12',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: false,
    },
    {
        id: ImageSizeIds.customPrint,
        width: null,
        height: null,
        resolution: 300,
        labelKey: 'images.create.sizes.custom',
        excludeStyleSets: [],
        media: Media.print,
        rotatable: true,
    },
];