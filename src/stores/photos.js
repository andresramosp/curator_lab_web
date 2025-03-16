// stores/photos.js
import { defineStore } from "pinia";
import axios from "axios";

export const usePhotosStore = defineStore("photos", {
  state: () => ({
    photos: [],
    isLoading: false, // Manejo del estado global de carga
    isAnalyzing: false, // Indica si hay fotos en análisis
  }),

  actions: {
    /** 🔹 Setea las fotos en el estado y marca las que están en análisis */
    setPhotos(photos) {
      this.photos = photos.map((photo) => ({
        ...photo,
      }));
    },

    /** 🔹 Agrega nuevas fotos al store evitando duplicados */
    addPhotos(newPhotos) {
      const newPhotoIds = newPhotos.map((p) => p.id);
      this.photos = [
        ...this.photos.filter((p) => !newPhotoIds.includes(p.id)),
        ...newPhotos.map((photo) => ({
          ...photo,
        })),
      ];
    },

    /** 🔹 Actualiza el estado de una foto específica */
    updatePhotoStatus(photoId, newStatus) {
      const photo = this.photos.find((p) => p.id === photoId);
      if (photo) {
        Object.assign(photo, newStatus);
      }
    },

    /** 🔹 Elimina una foto y hace la llamada API */
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
  },
});
