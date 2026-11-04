export let brandImage;
export let starImage;
export let orbitImage;
export let glowImage;

export async function loadBrand() {
  if (brandImage && starImage && orbitImage && glowImage) return;
  const images = await Promise.all(['logo.png', 'star.png', 'orbit.png', 'glow.png'].map(async name => {
    const image = new Image();
    image.src = new URL(`../assets/${name}`, import.meta.url).href;
    await image.decode();
    return image;
  }));
  [brandImage, starImage, orbitImage, glowImage] = images;
}
