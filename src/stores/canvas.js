import { defineStore } from "pinia";
import axios from "axios";

const PHOTO_WIDTH = 150 * 1.5;
const PHOTO_HEIGHT = 100 * 1.5;
let currentZIndex = 1;

function createPhoto(
  backendPhoto,
  basePosition = { x: 150, y: 100 },
  fromPhoto = false
) {
  currentZIndex++;
  return {
    id: backendPhoto.id,
    src: `${import.meta.env.VITE_API_BASE_URL}/uploads/photos/${
      backendPhoto.name
    }`,
    config: {
      x: basePosition.x,
      y: basePosition.y,
      width: PHOTO_WIDTH,
      height: PHOTO_HEIGHT,
      opacity: fromPhoto ? 0 : 1,
      zIndex: currentZIndex,
    },
    image: null,
    selected: false,
    showButton: false,
  };
}

export const useCanvasStore = defineStore("canvas", {
  state: () => ({
    photos: [],
  }),
  actions: {
    // Trae la info básica de la foto si no se tiene, usando el endpoint /catalog/photosByIds
    async addPhotos(photoIds) {
      const missingIds = photoIds.filter(
        (id) => !this.photos.some((photo) => photo.id === id)
      );
      if (!missingIds.length) return;
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/catalog/photosByIds`,
          { photosIds: missingIds }
        );
        const backendPhotos = Array.isArray(response.data)
          ? response.data
          : [response.data];
        backendPhotos.forEach((backendPhoto) => {
          if (!this.photos.some((photo) => photo.id === backendPhoto.id)) {
            this.photos.push(createPhoto(backendPhoto));
          }
        });
      } catch (error) {
        console.error("Error al añadir fotos desde el catálogo:", error);
      }
    },
    // Trae fotos similares usando el endpoint /byPhotos
    async addPhotosFromPhoto(photoIds, basePosition) {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/search/byPhotos`,
          {
            photoIds,
            currentPhotosIds: this.photos.map((p) => p.id),
            criteria: "semantic",
            opposite: false,
            tagsIds: null,
            descriptionCategory: "story",
            iteration: 1,
            pageSize: 1,
            withInsights: false,
          }
        );
        const backendPhotos = Array.isArray(response.data)
          ? response.data
          : [response.data];
        backendPhotos.forEach((backendPhoto) => {
          if (!this.photos.some((photo) => photo.id === backendPhoto.id)) {
            this.photos.push(createPhoto(backendPhoto, basePosition, true));
          }
        });
      } catch (error) {
        console.error("Error al añadir fotos similares:", error);
      }
    },
  },
});
