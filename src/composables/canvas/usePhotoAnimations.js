// src/composables/usePhotoAnimations.js
import Konva from "konva";
import { nextTick } from "vue";

export function usePhotoAnimations() {
  const animatePhoto = (groupNode, targetX, targetY, duration = 0.7) => {
    new Konva.Tween({
      node: groupNode,
      duration,
      x: targetX,
      y: targetY,
      opacity: 1,
      easing: Konva.Easings.StrongEaseInOut,
    }).play();
  };

  const animatePhotoGroup = (
    photoRefs,
    photos,
    basePosition,
    position,
    offsetX,
    offsetY,
    photo
  ) => {
    nextTick(() => {
      const newPhotos = photos.value.filter((p) => p.config.opacity === 0);
      const count = newPhotos.length;
      newPhotos.forEach((newPhoto, index) => {
        const groupNode = photoRefs.value[newPhoto.id]?.getNode();
        if (!groupNode) return;
        let targetX = basePosition.x;
        let targetY = basePosition.y;
        if (["left", "right", "upper", "bottom"].includes(position)) {
          if (position === "left") {
            targetX = basePosition.x - offsetX * (index + 1);
          } else if (position === "right") {
            targetX = basePosition.x + offsetX * (index + 1);
          } else if (position === "upper") {
            targetY = basePosition.y - offsetY * (index + 1);
          } else if (position === "bottom") {
            targetY = basePosition.y + offsetY * (index + 1);
          }
        } else if (
          ["upper-left", "upper-right", "bottom-right", "bottom-left"].includes(
            position
          )
        ) {
          if (count === 1) {
            if (position === "upper-left") {
              targetX = basePosition.x - offsetX;
              targetY = basePosition.y - offsetY;
            } else if (position === "upper-right") {
              targetX = basePosition.x + offsetX;
              targetY = basePosition.y - offsetY;
            } else if (position === "bottom-right") {
              targetX = basePosition.x + offsetX;
              targetY = basePosition.y + offsetY;
            } else if (position === "bottom-left") {
              targetX = basePosition.x - offsetX;
              targetY = basePosition.y + offsetY;
            }
          } else if (count === 2) {
            if (index === 0) {
              targetX =
                position === "upper-left" || position === "bottom-left"
                  ? basePosition.x - offsetX
                  : basePosition.x + offsetX;
              targetY = basePosition.y;
            } else {
              targetX = basePosition.x;
              targetY =
                position === "upper-left" || position === "upper-right"
                  ? basePosition.y - offsetY
                  : basePosition.y + offsetY;
            }
          } else if (count === 3) {
            if (index === 0) {
              if (position === "upper-left") {
                targetX = basePosition.x - offsetX;
                targetY = basePosition.y - offsetY;
              } else if (position === "upper-right") {
                targetX = basePosition.x + offsetX;
                targetY = basePosition.y - offsetY;
              } else if (position === "bottom-right") {
                targetX = basePosition.x + offsetX;
                targetY = basePosition.y + offsetY;
              } else if (position === "bottom-left") {
                targetX = basePosition.x - offsetX;
                targetY = basePosition.y + offsetY;
              }
            } else if (index === 1) {
              targetX =
                position === "upper-left" || position === "bottom-left"
                  ? basePosition.x - offsetX
                  : basePosition.x + offsetX;
              targetY = basePosition.y;
            } else if (index === 2) {
              targetX = basePosition.x;
              targetY =
                position === "upper-left" || position === "upper-right"
                  ? basePosition.y - offsetY
                  : basePosition.y + offsetY;
            }
          } else {
            const cols = Math.ceil(Math.sqrt(count));
            const row = Math.floor(index / cols);
            const col = index % cols;
            if (position === "upper-left") {
              targetX = basePosition.x - offsetX - col * offsetX;
              targetY = basePosition.y - offsetY - row * offsetY;
            } else if (position === "upper-right") {
              targetX = basePosition.x + offsetX + col * offsetX;
              targetY = basePosition.y - offsetY - row * offsetY;
            } else if (position === "bottom-right") {
              targetX = basePosition.x + offsetX + col * offsetX;
              targetY = basePosition.y + offsetY + row * offsetY;
            } else if (position === "bottom-left") {
              targetX = basePosition.x - offsetX - col * offsetX;
              targetY = basePosition.y + offsetY + row * offsetY;
            }
          }
        }
        animatePhoto(groupNode, targetX, targetY, 0.7);
        setTimeout(() => {
          newPhoto.config.x = targetX;
          newPhoto.config.y = targetY;
          newPhoto.config.opacity = 1;
        }, 700);
      });
      photo.baseAngleInc = (photo.baseAngleInc || 0) + 30;
    });
  };

  return { animatePhoto, animatePhotoGroup };
}
