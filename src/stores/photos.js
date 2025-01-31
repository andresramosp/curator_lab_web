// stores/photos.js
import { defineStore } from "pinia";

export const usePhotosStore = defineStore("photos", {
  state: () => ({
    photos: [],
    isLoading: false, // Estado para manejar el loading
    isAnalyzing: false,
  }),
  actions: {
    async fetchPhotos() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/catalog`
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const { photos: allPhotos } = await response.json();
        this.photos = allPhotos; // Actualizar el estado con todas las fotos
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    },
    async uploadPhotos(files) {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("photos", file);
      });

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/catalog/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const { savedPhotos } = await response.json();
        this.photos = [...this.photos, ...savedPhotos]; // Añadir las nuevas fotos al estado actual
      } catch (error) {
        console.error("Error uploading photos:", error);
      }
    },
    deletePhoto(photoId) {
      // llamada API
      this.photos = this.photos.filter((photo) => photo.id != photoId);
    },
    async analyze(photosId = []) {
      let photosToAnalyze = [];
      if (photosId.length) {
        photosToAnalyze = this.photos.filter((photo) =>
          photosId.includes(photo.id)
        );
        for (let photo of photosToAnalyze) {
          delete photo.metadata;
        }
      } else {
        photosToAnalyze = this.photos.filter((photo) => !photo.metadata);
      }

      if (!photosToAnalyze.length) {
        console.log("No hay imágenes para analizar");
        return;
      }
      this.isAnalyzing = true;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/analyzer/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json", // Indica que el body es JSON
            },
            body: JSON.stringify({ photos: photosToAnalyze }),
          }
        );

        if (!response.ok) {
          throw new Error("Error en el procesamiento de imágenes");
        }

        const data = await response.json();
        console.log("Respuesta del servidor:", data);

        // Añadir metadata a cada foto
        // data.results.forEach((result) => {
        //   const photo = this.photos.find((p) => p.id === result.id);
        //   if (photo) {
        //     photo.metadata = result;
        //     photo.description = result.
        //   }
        // });
        this.fetchPhotos();
      } catch (error) {
        console.error("Error al analizar imágenes:", error);
      } finally {
        this.isAnalyzing = false;
      }
    },
  },
});
