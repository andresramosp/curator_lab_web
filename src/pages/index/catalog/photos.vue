<template>
  <div class="main-container">
    <PhotosGrid :photos="photosStore.photos" />

    <div v-if="!photosStore.photos.length" class="sync-buttons-init">
      <v-btn class="sync-button" @click="openFileDialog"> 📁 Local </v-btn>
      <v-btn class="sync-button" @click="syncGooglePhotos">
        Google Photos
      </v-btn>
    </div>
    <div v-else class="add-photos-button">
      <v-btn class="sync-button" @click="openFileDialog"> 📁 Add Photos </v-btn>
    </div>

    <input type="file" ref="fileInput" multiple hidden @change="uploadFiles" />

    <div class="alert-message">
      <v-alert v-if="photosStore.isAnalyzing" dense class="alert-progress">
        <div class="processing-content">
          <v-icon class="processing-icon" size="40">mdi-progress-clock</v-icon>
          <div class="processing-text">
            <v-progress-linear
              indeterminate
              color="secondary"
              class="progress-bar"
            ></v-progress-linear>
            We are now processing your photos. This process may take several
            minutes. You can close the application in the meantime. You can also
            add more photos during this process.
          </div>
        </div>
      </v-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { usePhotosStore } from "@/stores/photos";
import axios from "axios";
import { io } from "socket.io-client";

const photosStore = usePhotosStore();
const fileInput = ref(null);
const socket = io(import.meta.env.VITE_API_BASE_URL); // Conexión al WebSocket

/** 🔹 Abre el selector de archivos */
function openFileDialog() {
  fileInput.value.click();
}

/** 🔹 Sube fotos seleccionadas y actualiza la UI */
async function uploadFiles(event) {
  const selectedFiles = Array.from(event.target.files);
  if (selectedFiles.length === 0) return;

  const formData = new FormData();
  selectedFiles.forEach((file) => {
    formData.append("photos", file);
  });

  try {
    photosStore.isLoading = true; // Iniciamos loading
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/catalog/upload`, {
      method: "POST",
      body: formData,
    });

    await fetchFiles(); // Refrescar la lista de fotos después de subirlas
  } catch (error) {
    console.error("❌ Error uploading photos:", error);
  } finally {
    photosStore.isLoading = false; // Terminamos loading
    event.target.value = ""; // Reset input file
  }
}

/** 🔹 Obtiene la lista de fotos y detecta si hay fotos en análisis */
async function fetchFiles() {
  try {
    photosStore.isLoading = true;
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/catalog`
    );

    // 🔹 Añadir un flag explícito de análisis para la UI
    const photos = response.data.photos.map((photo) => ({
      ...photo,
      analyzing: !photo.metadata, // Si no tiene metadata, está en análisis
    }));

    photosStore.setPhotos(photos);

    // 🔹 Si hay fotos sin metadata, iniciar/enganchar al análisis
    if (photos.some((photo) => photo.analyzing)) {
      analyze();
    }
  } catch (error) {
    console.error("❌ Error fetching photos:", error);
  } finally {
    photosStore.isLoading = false;
  }
}

/** 🔹 Inicia el análisis de fotos */
async function analyze() {
  try {
    photosStore.isAnalyzing = true;
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/analyzer`, {
      userId: "1234",
    });
  } catch (error) {
    console.error("❌ Error iniciando análisis:", error);
  }
}

/** 🔹 Simulación de sincronización con Google Photos */
function syncGooglePhotos() {
  console.log("🔄 Sync Google Photos (Futuro desarrollo)");
}

/** 🔹 Configuración de WebSockets */
onMounted(() => {
  fetchFiles(); // Cargar las fotos al inicio

  socket.on("photoProcessed", (data) => {
    console.log("✅ Foto procesada:", data);
    photosStore.updatePhotoStatus(data.id, {
      analyzing: false,
      metadata: data.metadata,
    });
  });

  socket.on("analysisComplete", (data) => {
    console.log("✔️ Análisis completado. Costo total:", data.cost);
    photosStore.isAnalyzing = false; // Marcar que el análisis ha terminado
  });
});
</script>

<style scoped>
.sync-buttons-init {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.add-photos-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: sticky;

  bottom: 10px;
}

.alert-message {
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  left: 50%;
  transform: translateX(-50%);
  position: absolute;
  top: 10;
  flex-direction: row;
}

.alert-progress {
  font-size: 14px;
  width: 500px;
}

.sync-button {
  width: 250px;
  margin: 10px;
  font-size: 16px;
}

.google-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.progress-bar {
  width: 100%;
  margin-bottom: 5px;
}

.processing-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.processing-icon {
  flex: 0 0 15%;
  text-align: center;
}

.processing-text {
  flex: 1;
  text-align: left;
}
</style>
