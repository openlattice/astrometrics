declare var __MAPBOX_TOKEN__;

const MAP_IMG_PIXELS = 600;

export const getMapImgUrlAtSize = (lat, long, width, height) => `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l-car+000(${long},${lat})/${long},${lat},15/${width}x${height}?access_token=${__MAPBOX_TOKEN__}`;

export const getMapImgUrl = (lat, long) => getMapImgUrlAtSize(lat, long, MAP_IMG_PIXELS, MAP_IMG_PIXELS);

export const getDrawCoordsFromFeatures = ({ features }) => {
  const coordinateSets = [];

  features.forEach(({ geometry }) => {
    const { coordinates } = geometry;
    coordinateSets.push(...coordinates);
  });

  return coordinateSets;
};
