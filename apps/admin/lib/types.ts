export const IMAGE_SIZES = {
    thumbnail: { width: 200, height: 200 },
    small: { width: 400, height: 400 },
    medium: { width: 800, height: 800 },
    large: { width: 1200, height: 1200 },
    original: { width: null, height: null }
}
export type ImageSize = keyof typeof IMAGE_SIZES  