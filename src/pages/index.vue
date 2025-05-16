<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>
        <div class="logo-container">
          <img style="width: 35px;" :src="logo" alt="CuratorLab Logo"></img>
          <img  style="width: 200px" :src="logoText" alt="CuratorLab Logo"></img>
        </div>
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>mdi-account-circle</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer app permanent width="90">
      <v-list>
        <v-list-item
          v-for="section in sections"
          :key="section.title"
          @click="goTo(section.route)"
          class="menu-item"
        >
          <v-list-item-icon>
            <v-icon>{{ section.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ section.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <!-- <keep-alive include="SearchPage,PhotosPage,CanvasPage">
        <router-view />
      </keep-alive> -->

      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { useRouter } from "vue-router";
import logoText from "@/assets/logo.png";
import logo from "@/assets/CuratorLogoGray.png";

const router = useRouter();

const sections = [
  // { title: "Photos", icon: "mdi-image", route: "/photos" },
  // { title: "Collections", icon: "mdi-folder", route: "/catalog/collections" },
  { title: "Search", icon: "mdi-magnify", route: "/search" },

  { title: "Canvas", icon: "mdi-artboard", route: "/canvas" },
  { title: "Curator", icon: "mdi-palette-swatch", route: "/curator" },
  // { title: "Settings", icon: "mdi-tune", route: "/settings" },
];

function goTo(route) {
  router.push(route);
}
</script>

<style scoped>
.menu-item {
  text-align: center;
  cursor: pointer;
}
.menu-item .v-list-item-title {
  font-size: 0.7rem;
}
.logo-container {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 7px
}
</style>
