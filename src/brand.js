export let brandImage;
export let starImage;

export async function loadBrand() {
  if (brandImage && starImage) return;
  const images = await Promise.all(['logo.png', 'star.png'].map(async name => {
    const image = new Image();
    image.src = new URL(`../assets/${name}`, import.meta.url).href;
    await image.decode();
    return image;
  }));
  [brandImage, starImage] = images;
}
