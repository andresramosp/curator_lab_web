// stores/photos.js
import { defineStore } from "pinia";
import axios from "axios";

export const usePhotosStore = defineStore("photos", {
  state: () => ({
    photos: [],
    isLoading: false,
    isAnalyzing: false,
    selectedPhotosRecord: {},
  }),

  getters: {
    selectedPhotoIds: (state) =>
      Object.keys(state.selectedPhotosRecord).filter(
        (photoId) => !!state.selectedPhotosRecord[photoId]
      ),
  },

  actions: {
    async getOrFetch() {
      if (this.photos.length === 0 && !this.isLoading) {
        this.isLoading = true;
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/catalog`
          );

          const photos = response.data.photos.map((photo) => ({
            ...photo,
            analyzing: photo.needProcess,
          }));

          this.photos = photos.map((photo) => ({ ...photo }));
        } catch (error) {
          console.error("Error en getOrFetchAll:", error);
        } finally {
          this.isLoading = false;
        }
      }
      return this.photos;
    },

    addPhotos(newPhotos) {
      const newPhotoIds = newPhotos.map((p) => p.id);
      this.photos = [
        ...this.photos.filter((p) => !newPhotoIds.includes(p.id)),
        ...newPhotos.map((photo) => ({ ...photo })),
      ];
    },

    updatePhotoStatus(photoId, newStatus) {
      const photo = this.photos.find((p) => p.id === photoId);
      if (photo) {
        Object.assign(photo, newStatus);
      }
    },

    async deletePhoto(photoId) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/api/photos/${photoId}`
        );
        this.photos = this.photos.filter((photo) => photo.id !== photoId);
      } catch (error) {
        console.error("Error deleting photo:", error);
      }
    },

    togglePhotoSelection(photoId) {
      this.selectedPhotosRecord[photoId] = !this.selectedPhotosRecord[photoId];
    },
  },
});
