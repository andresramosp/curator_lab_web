<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>
        <v-img width="200" :src="logo" alt="CuratorLab Logo" fill></v-img>
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
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { useRouter } from "vue-router";
import logo from "@/assets/logo.png";

const router = useRouter();

const sections = [
  { title: "Photos", icon: "mdi-image", route: "/photos" },
  // { title: "Collections", icon: "mdi-folder", route: "/catalog/collections" },
  { title: "Search", icon: "mdi-magnify", route: "/search" },

  { title: "Canvas", icon: "mdi-artboard", route: "/canvas" },
  { title: "Series", icon: "mdi-palette-swatch", route: "/series" },
  { title: "Settings", icon: "mdi-tune", route: "/settings" },
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
</style>
