export const StyleSetTypes = {
    green: 'green',
    green2025: 'green2025',
    greenCentered: 'greenCentered',
    green2025Centered: 'green2025Centered',
    young: 'young'
}

export const MinFontSizeFactors = {
    [StyleSetTypes.green]: 0.0625, // the correct 175% would be 0.0925
    [StyleSetTypes.green2025]: 0.0625, // the correct 175% would be 0.0925
    [StyleSetTypes.greenCentered]: 0.0625, // the correct 175% would be 0.0925
    [StyleSetTypes.green2025Centered]: 0.0625, // the correct 175% would be 0.0925
    [StyleSetTypes.young]: 0.0575,
}

export const MaxFontSizeFactors = {
    [StyleSetTypes.green]: 0.99,
    [StyleSetTypes.green2025]: 0.99,
    [StyleSetTypes.greenCentered]: 0.99,
    [StyleSetTypes.green2025Centered]: 0.99,
    [StyleSetTypes.young]: 0.9,
}

export const MinToMaxFontSizeFactors = {
    [StyleSetTypes.green]: 4,
    [StyleSetTypes.green2025]: 4,
    [StyleSetTypes.greenCentered]: 4,
    [StyleSetTypes.green2025Centered]: 4,
    [StyleSetTypes.young]: 4,
}

export const Media = {
    screen: 'screen',
    print: 'print',
}

export const Formats = {
    digital: 'digital',
    printSelf: 'printSelf',
    printProfessional: 'printProfessional',
}

export const FileFormats = {
    png: 'png',
    pdf: 'pdf',
}

export const ColorEncodings = {
    sRGB: 'sRGB',
    FOGRA51: 'FOGRA51', // FOGRA51 === PSO Coated v3
}

export const Alignments = {
    left: -1,
    center: 0,
    right: 1,
};

export const BackgroundTypes = {
    placeholder: 'placeholder',
    gradient: 'gradient',
    icons: 'icons',
    transparent: 'transparent',
    image: 'custom'
};

export const PrintingBleed = 3; // mm

export const Inch2mm = 25.4; // 1inch = 25.4mm

export const MarkColor = '#ff8000';
export const MarkColorActive = '#ff0000';
export const MarkBackgroundColor = 'rgba(200, 200, 200, 0.2)';
export const MarkBackgroundColorActive = 'rgba(200, 200, 200, 0.4)';
export const MarkWidth = 2;

export const BorderWidthFactor = 0.0175;
export const BorderRadiusFactor = 1;

export const HugeImageJpegQuality = 0.9;
export const RegularImageQuality = 1; // jpeg AND png
export const HugeImageSurfaceLimit = 5000 ** 2; // 5000px x 5000px

/**
 * How much can the background image be zoomed up?
 *
 * 2 = 200% (twice the pixel size)
 * 1 = 100% (do not scale up the image)
 *
 * @type {number}
 */
export const MaxImageZoomFactor = 2;

// https://stackoverflow.com/a/11585939
export const CanvasMaxSideLen = 16384

export const BarSchemes = {
    white: {
        background: '#ffffff',
        text: '#84b414',
    },
    green: {
        background: '#84b414',
        text: '#ffffff',
    },
    green2025: {
        background: '#f8e6f0',
        text: '#e10078',
    },
    magenta: {
        background: '#e10078',
        text: '#ffffff',
    },
    transparent: {
        background: 'rgba(0,0,0,0)',
        text: '#ffffff',
    },
};

export const CopyrightColors = {
    withBorder: '#666666',
    noBorder: '#ffffff',
};

export const ColorSchemes = {
    white: 'white',
    green: 'green',
    green2025: 'green2025',
    greengreen: 'green-green',
};

export const BarTypes = {
    headline: 'headline',
    subline: 'subline',
};

export const LogoTypes = {
    alternative: 'alternative',
    'alternative-baar': 'alternative-baar',
    'alternative-cham': 'alternative-cham',
    'alternative-risch': 'alternative-risch',
    'alternative-stadt-zug': 'alternative-stadt-zug',
    'alternative-unteraegeri': 'alternative-unteraegeri',
    basta: 'basta',
    'giovani-verdi': 'giovani-verdi',
    gruene: 'gruene',
    'gruene-vert-e-s': 'gruene-vert-e-s',
    'gruene-verts': 'gruene-verts',
    'jeunes-vert-e-s': 'jeunes-vert-e-s',
    'junge-gruene': 'junge-gruene',
    verda: 'verda',
    verdi: 'verdi',
    'vert-e-s': 'vert-e-s',
    verts: 'verts',
};

export const LogoTypeRatios = {
    [LogoTypes.alternative]: 4,
    [LogoTypes['alternative-baar']]: 4,
    [LogoTypes['alternative-cham']]: 4,
    [LogoTypes['alternative-risch']]: 4,
    [LogoTypes['alternative-stadt-zug']]: 4,
    [LogoTypes['alternative-unteraegeri']]: 4,
    [LogoTypes['giovani-verdi']]: 3.45,
    [LogoTypes.basta]: 4,
    [LogoTypes.gruene]: 4,
    [LogoTypes['gruene-vert-e-s']]: 4,
    [LogoTypes['gruene-verts']]: 4,
    [LogoTypes['jeunes-vert-e-s']]: 3,
    [LogoTypes['junge-gruene']]: 3.2,
    [LogoTypes.verda]: 4,
    [LogoTypes.verdi]: 4,
    [LogoTypes['vert-e-s']]: 4,
    [LogoTypes.verts]: 4,
};

/**
 * Specifies the oversize of the bar in relation to the canvas width.
 *
 * 0.2 means that we'll add 20% of the canvas width to the bar.
 *
 * @type {number}
 */
export const BarSizeFactor = 0.2;

/**
 * If anything is rotated use this angle.
 *
 * @type {number}
 */
export const RotationAngle = -0.0872664626; // 5 degrees ccw in radians cw
