<template>
  <div class="main-container photos">
    <PhotosGrid
      :photos="photosStore.photos"
      :uploadingPhotos="uploadingPhotos"
    />

    <!-- <div v-if="!googleAccessToken" class="sync-buttons-init">
      <v-btn class="sync-button" @click="openFileDialog"> 📁 Local </v-btn>
      <v-btn class="sync-button" @click="syncGooglePhotos">
        Sync Google Photos
      </v-btn>
    </div> -->
    <!-- <div
      v-else-if="!photosStore.isAnalyzing && uploadingPhotos == 0"
      class="add-photos-button"
    > -->
    <div class="grid-floating-buttons">
      <v-btn class="sync-button" @click="fetchGoogleAlbums()">
        📁 Add Photos
      </v-btn>
      <v-btn class="sync-button" @click="openFileDialog"> 📁 Local </v-btn>
      <!-- <v-btn class="sync-button" @click="analyze()"> Curate </v-btn>-->
    </div>

    <input
      type="file"
      ref="fileInput"
      multiple
      hidden
      @change="uploadLocalFiles"
    />

    <v-dialog v-model="showAlbumsDialog" max-width="500px">
      <v-card>
        <v-card-title>Select a Google Photos Album</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="album in googleAlbums"
              :key="album.id"
              @click="selectAlbum(album)"
            >
              <v-list-item-content>
                <v-list-item-title>{{ album.title }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="showAlbumsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div class="alert-message">
      <v-alert
        v-if="photosStore.isAnalyzing || uploadingPhotos > 0"
        dense
        class="alert-text"
      >
        <div class="processing-content">
          <v-icon class="processing-icon" size="40">{{
            photosStore.isAnalyzing ? "mdi-progress-clock" : "mdi-file"
          }}</v-icon>
          <div class="processing-text">
            <v-progress-linear
              indeterminate
              color="secondary"
              class="progress-bar"
            ></v-progress-linear>
            {{
              photosStore.isAnalyzing
                ? "We are now processing your photos. This process may take several minutes. You can close the application in the meantime."
                : "Your photos are being uploaded. Please wait and don't close this window."
            }}
          </div>
        </div>
      </v-alert>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "PhotosPage" });
import { ref, onMounted } from "vue";
import { usePhotosStore } from "@/stores/photos";
import axios from "axios";
import { io } from "socket.io-client";
import PhotosGrid from "@/components/PhotosGrid.vue";
import pLimit from "p-limit";
import pica from "pica";

const photosStore = usePhotosStore();
const fileInput = ref(null);
const socket = io(import.meta.env.VITE_API_BASE_URL);
const googleAccessToken = ref(localStorage.getItem("access_token") || null);
const googleAlbums = ref([]);
const showAlbumsDialog = ref(false);
const uploadingPhotos = ref(0);

const picaInstance = pica();
const limit = pLimit(10);

/** 🔹 Abre el selector de archivos */
function openFileDialog() {
  fileInput.value.click();
}

async function uploadLocalFiles(event) {
  const selectedFiles = Array.from(event.target.files);
  if (selectedFiles.length === 0) return;

  uploadingPhotos.value = selectedFiles.length;

  try {
    await Promise.all(
      selectedFiles.map((file) => limit(() => processAndUploadFile(file)))
    );
    await photosStore.getOrFetch(true);
  } catch (error) {
    console.error("❌ Error en la subida:", error);
  } finally {
    uploadingPhotos.value = 0;
    event.target.value = "";
  }
}

async function processAndUploadFile(file) {
  // Redimensionar original y thumbnail en paralelo
  const [resizedBlob, thumbnailBlob] = await Promise.all([
    resizeImage(file, 1500),
    resizeImage(file, 800),
  ]);

  // Pedir URLs firmadas al backend
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/api/catalog/uploadLocal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileType: resizedBlob.type }),
    }
  );

  if (!res.ok) throw new Error("Error obteniendo URLs firmadas");
  const { uploadUrl, thumbnailUploadUrl, photo } = await res.json();

  // Subir original y thumbnail en paralelo
  await Promise.all([
    fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": resizedBlob.type },
      body: resizedBlob,
    }),
    fetch(thumbnailUploadUrl, {
      method: "PUT",
      headers: { "Content-Type": thumbnailBlob.type },
      body: thumbnailBlob,
    }),
  ]);

  photosStore.photos.unshift(photo);

  // Confirmar subida al backend
  // await fetch(${import.meta.env.VITE_API_BASE_URL}/api/catalog/confirm-upload, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ key, publicUrl }),
  // })
}

async function resizeImage(file, targetWidth) {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const scale = targetWidth / img.width;
  canvas.width = targetWidth;
  canvas.height = img.height * scale;

  await picaInstance.resize(img, canvas);
  const blob = await picaInstance.toBlob(canvas, "image/jpeg", 0.9);
  return blob;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function uploadGooglePhotos(mediaItems) {
  if (!mediaItems.length) return;

  try {
    uploadingPhotos.value = mediaItems.length;

    await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/catalog/uploadGooglePhotos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photos: mediaItems.map((item) => ({
            ...item,
          })),
        }),
      }
    );

    uploadingPhotos.value = 0;

    await photosStore.getOrFetch(); // Refrescar la lista de fotos
  } catch (error) {
    console.error("❌ Error uploading Google Photos:", error);
  } finally {
  }
}

/** 🔹 Inicia el análisis de fotos */
async function analyze() {
  try {
    photosStore.isAnalyzing = true;
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/analyzer`, {
      userId: "1234",
      packageId: "basic_1", // "topological_upgrade",
      mode: "adding",
      // processId: 4,
    });
  } catch (error) {
    console.error("❌ Error iniciando análisis:", error);
  }
}

/** 🔹 Autenticación con Google y sincronización de fotos */
async function syncGooglePhotos() {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/catalog/google/sync`
    );
    window.location.href = response.data.authUrl; // ✅ Esto redirige al usuario al login de Google
  } catch (error) {
    console.error("❌ Error autenticando con Google Photos:", error);
  }
}

/** 🔹 Obtiene los álbumes del usuario desde Google Photos */
async function fetchGoogleAlbums(pageToken = null) {
  if (!googleAccessToken.value) return;

  try {
    const params = {
      pageSize: 50, // Establece el número de álbumes por solicitud
    };

    if (pageToken) {
      params.pageToken = pageToken; // Agrega el token de página si existe
    }

    const response = await axios.get(
      "https://photoslibrary.googleapis.com/v1/albums",
      {
        headers: { Authorization: `Bearer ${googleAccessToken.value}` },
        params,
      }
    );

    if (response.data.albums) {
      googleAlbums.value.push(...response.data.albums); // Agrega los álbumes obtenidos
    }

    // Si hay un token para la siguiente página, realiza una nueva solicitud
    if (response.data.nextPageToken) {
      await fetchGoogleAlbums(response.data.nextPageToken);
    } else {
      showAlbumsDialog.value = true; // Muestra el diálogo cuando se hayan cargado todos los álbumes
    }
  } catch (error) {
    console.error("❌ Error obteniendo álbumes de Google Photos:", error);
  }
}

/** 🔹 Selecciona un álbum y obtiene sus fotos */
async function selectAlbum(album, maxPhotos = 500) {
  // 🔹 Puedes cambiar el límite aquí
  try {
    let allPhotos = [];
    let nextPageToken = null;

    do {
      const response = await axios.post(
        "https://photoslibrary.googleapis.com/v1/mediaItems:search",
        {
          albumId: album.id,
          pageSize: 100, // 🔹 Máximo permitido por Google
          pageToken: nextPageToken, // 🔹 Token de la siguiente página
        },
        {
          headers: { Authorization: `Bearer ${googleAccessToken.value}` },
        }
      );

      if (response.data.mediaItems) {
        const remaining = maxPhotos - allPhotos.length; // 🔹 Cuántas fotos faltan para el límite
        allPhotos.push(...response.data.mediaItems.slice(0, remaining)); // 🔹 Solo agrega lo necesario
      }

      nextPageToken = response.data.nextPageToken || null;
    } while (nextPageToken && allPhotos.length < maxPhotos); // 🔹 Detener cuando se alcanza el límite

    uploadGooglePhotos(allPhotos);
    showAlbumsDialog.value = false;
  } catch (error) {
    console.error("❌ Error obteniendo fotos del álbum:", error);
  }
}

const checkGooglePhotosCallback = () => {
  const query = new URLSearchParams(window.location.search);
  const token = query.get("access_token");

  if (token) {
    localStorage.setItem("access_token", token);
    googleAccessToken.value = token;
    window.history.replaceState({}, document.title, "/catalog/photos"); // Limpia la URL
  }
};

/** 🔹 Configuración de WebSockets */
onMounted(() => {
  checkGooglePhotosCallback();
  photosStore.getOrFetch();

  socket.on("analysisComplete", (data) => {
    console.log("✔️ Análisis completado. Costo total:", data.cost);
    photosStore.isAnalyzing = false;
    photosStore.getOrFetch();
  });

  socket.on("photoProcessed", (data) => {
    console.log("✅ Foto procesada:", data);
    photosStore.updatePhotoStatus(data.id, {
      analyzing: false,
      processed: !data.needProcess,
    });
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
