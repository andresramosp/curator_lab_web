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
    discardedPhotos: [],
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
    async addPhotosFromPhoto(photoIds, similarityType, basePosition) {
      try {
        const currentOrDiscardedPhotos = [
          ...this.photos.map((p) => p.id),
          // ...this.discardedPhotos.map((p) => p.id),
        ];
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/search/byPhotos`,
          {
            photoIds,
            currentPhotosIds: currentOrDiscardedPhotos,
            criteria: similarityType.criteria,
            opposite: false,
            tagsIds: null,
            descriptionCategories: similarityType.fields,
            iteration: 1,
            pageSize: 1,
            withInsights: false,
            opposite: false,
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
    deletePhotos(photoBase) {
      const photosToRemove = this.photos.filter(
        (p) => p.selected || p.id == photoBase.id
      );
      this.photos = this.photos.filter(
        (p) => !photosToRemove.map((p) => p.id).includes(p.id)
      );
      this.discardedPhotos = this.discardedPhotos.concat(photosToRemove);
    },
  },
});
