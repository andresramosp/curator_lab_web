<template>
  <div id="canvas-wrapper">
    <button class="catalog-button" @click="addNewPhoto">Add Photo</button>
    <canvas ref="canvasRef" id="fabric-canvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { fabric } from "fabric";

const canvasRef = ref(null);
let canvas;

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const imageNames = [
  "1742648875207-DSC02238.jpg",
  "1742648875384-DSC02277.jpg",
  "1742648877582-DSC08287-2.jpg",
  "1742648879121-DSC09856.jpg",
];

const getRandomImageSrc = () => {
  const randomName = imageNames[Math.floor(Math.random() * imageNames.length)];
  return `${baseUrl}/uploads/photos/${randomName}`;
};

const addPhotoAt = (x, y) => {
  const src = getRandomImageSrc();
  fabric.Image.fromURL(src, (img) => {
    img.set({
      left: x,
      top: y,
      scaleX: 0.3,
      scaleY: 0.3,
      selectable: true,
      hasControls: true,
    });
    canvas.add(img);
    canvas.setActiveObject(img);
  });
};

const addNewPhoto = () => {
  addPhotoAt(100, 100);
};

const handleImageClick = (target) => {
  const bounds = target.getBoundingRect();
  addPhotoAt(bounds.left + 30, bounds.top + 30);
};

onMounted(() => {
  canvas = new fabric.Canvas(canvasRef.value, {
    width: window.innerWidth,
    height: window.innerHeight,
    selection: true,
    backgroundColor: "#fff",
  });

  // Zoom con scroll hacia el puntero
  canvas.on("mouse:wheel", function (opt) {
    const delta = opt.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 5) zoom = 5;
    if (zoom < 0.2) zoom = 0.2;

    const pointer = canvas.getPointer(opt.e);
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });

  // Evento de click sobre imagen
  canvas.on("mouse:down", function (opt) {
    const target = opt.target;
    if (target && target.type === "image") {
      handleImageClick(target);
    }
  });

  // Añadir imágenes iniciales
  fabric.FabricImage.fromURL(
    `${baseUrl}/uploads/photos/1742647923741-1740648473927-DSC09839.jpg`,
    (img) => {
      img.set({ left: 50, top: 50, scaleX: 0.3, scaleY: 0.3 });
      canvas.add(img);
    }
  );

  fabric.FabricImage.fromURL(
    `${baseUrl}/uploads/photos/1742647923492-1740648472828-DSC07285.jpg`,
    (img) => {
      img.set({ left: 250, top: 100, scaleX: 0.3, scaleY: 0.3 });
      canvas.add(img);
    }
  );
});
</script>

<style scoped>
#canvas-wrapper {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

#fabric-canvas {
  display: block;
}

.catalog-button {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}
</style>
