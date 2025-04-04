import { defineStore } from "pinia";
import axios from "axios";

const PHOTO_WIDTH = 150 * 1.5;
const PHOTO_HEIGHT = 100 * 1.5;

function createPhoto(
  backendPhoto,
  basePosition = { x: 150, y: 100 },
  fromPhoto = false,
  currentZIndex
) {
  return {
    id: backendPhoto.id,
    src: `${import.meta.env.VITE_API_BASE_URL}/uploads/photos/${
      backendPhoto.name
    }`,
    // src: `C:/Users/andre/Desktop/Curator Lab/API_MODELS/debug_groundingdino_hf/${backendPhoto.id}.jpg`,
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
    tags: backendPhoto.tags,
    loading: false,
    detectionAreas: backendPhoto.detectionAreas,
  };
}

export const useCanvasStore = defineStore("canvas", {
  state: () => ({
    photos: [],
    discardedPhotos: [],
    currentZIndex: 1,
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
            this.photos.push(
              createPhoto(
                backendPhoto,
                undefined,
                undefined,
                this.currentZIndex
              )
            );
          }
        });
      } catch (error) {
        console.error("Error al añadir fotos desde el catálogo:", error);
      }
    },
    // Trae fotos similares usando el endpoint /byPhotos
    async addPhotosFromPhoto(
      basePhotos,
      similarityType,
      resultLength,
      basePosition,
      opposite,
      inverted
    ) {
      let basePhoto = basePhotos[0];
      try {
        basePhoto.loading = true;

        const photoIds = basePhotos.map((bp) => bp.id);

        const currentOrDiscardedPhotos = [
          ...this.photos.map((p) => p.id),
          // ...this.discardedPhotos.map((p) => p.id),
        ];
        let selectedTags = [];
        for (let photoId of photoIds) {
          let photo = this.photos.find((p) => p.id == photoId);
          let selectedPhotoTagsIds = photo.tags
            .filter((t) => t.tag.selected)
            .map((t) => t.tag.id);
          selectedTags = selectedTags.concat(selectedPhotoTagsIds);
        }

        let selectedBoxes = [];
        for (let photoId of photoIds) {
          let photo = this.photos.find((p) => p.id == photoId);
          let selectedDetectionAreasIds = photo.detectionAreas
            .filter((dt) => dt.selected)
            .map((dt) => dt.id);
          selectedBoxes = selectedBoxes.concat(selectedDetectionAreasIds);
        }

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/search/byPhotos`,
          {
            photoIds,
            currentPhotosIds: currentOrDiscardedPhotos,
            criteria: similarityType.criteria,
            opposite,
            inverted,
            descriptionCategories: similarityType.fields,
            resultLength,
            withInsights: false,
            tagIds: selectedTags,
            boxesIds: selectedBoxes,
          }
        );
        const backendPhotos = Array.isArray(response.data)
          ? response.data
          : [response.data];
        backendPhotos.forEach((backendPhoto) => {
          if (!this.photos.some((photo) => photo.id === backendPhoto.id)) {
            this.photos.push(
              createPhoto(backendPhoto, basePosition, true, this.currentZIndex)
            );
          }
        });
      } catch (error) {
        console.error("Error al añadir fotos similares:", error);
      } finally {
        basePhoto.loading = false;
      }
    },
    deletePhotos() {
      const photosToRemove = this.photos.filter((p) => p.selected);
      this.photos = this.photos.filter(
        (p) => !photosToRemove.map((p) => p.id).includes(p.id)
      );
      this.discardedPhotos = this.discardedPhotos.concat(photosToRemove);
    },
  },
});
