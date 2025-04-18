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
    // src: `${
    //   import.meta.env.VITE_API_BASE_URL
    // }/uploads/photos/boxes/structure_mlsd_${backendPhoto.id}.png`,
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
    addPhotos(photoObjects) {
      photoObjects.forEach((photo) => {
        if (!this.photos.some((p) => p.id === photo.id)) {
          this.photos.push(
            createPhoto(photo, undefined, false, this.currentZIndex)
          );
        }
      });
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
          let selectedDetectionIds = photo.detectionAreas
            .filter((dt) => dt.selected)
            .map((dt) => dt.id);
          selectedBoxes = selectedBoxes.concat(selectedDetectionIds);
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
    deletePhotos(photoIds) {
      const photosToRemove = this.photos.filter((p) => photoIds.includes(p.id));
      this.photos = this.photos.filter(
        (p) => !photosToRemove.map((p) => p.id).includes(p.id)
      );
      this.discardedPhotos = this.discardedPhotos.concat(photosToRemove);
    },
  },
});
