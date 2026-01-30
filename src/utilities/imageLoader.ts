declare var require: any;
export const getRandomImage = (): string => {
    const context = require.context('../../static/images', false, /\.(png|jpe?g|svg)$/);
    const keys = context.keys();
    if (keys.length === 0) return '';
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return context(randomKey).default;
};

export const getAllImages = (): string[] => {
    const context = require.context('../../static/images', false, /\.(png|jpe?g|svg)$/);
    return context.keys().map(key => context(key).default);
};
