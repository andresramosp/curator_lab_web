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
    <v-navigation-drawer app permanent width="80">
      <v-list>
        <v-list-item
          v-for="section in sections"
          :key="section.title"
          @click="selectSection(section)"
          class="menu-item"
        >
          <v-list-item-icon>
            <v-icon>{{ section.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ section.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-navigation-drawer app right v-if="selectedSection" width="150">
      <v-list>
        <v-list-item
          v-for="option in selectedSection.options"
          :key="option.title"
          @click="goTo(option.route)"
          class="submenu-item"
        >
          <div class="submenu-content">
            <span class="submenu-icon">
              <v-icon>{{ option.icon }}</v-icon>
            </span>
            <span class="submenu-title">
              {{ option.title }}
            </span>
          </div>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import logo from "@/assets/logo.png";

const sections = [
  {
    title: "Catalog",
    icon: "mdi-folder",
    options: [
      {
        title: "Photos",
        icon: "mdi-image",
        route: "/catalog/photos",
      },

      {
        title: "Collections",
        icon: "mdi-folder",
        route: "/catalog/collections",
      },
    ],
  },
  {
    title: "Explore",
    icon: "mdi-loupe",

    options: [
      {
        title: "By text",
        icon: "mdi-file-plus",
        route: "/explore/search-text",
      },
      {
        title: "By tags",
        icon: "mdi-file-plus",
        route: "/explore/search-tags",
      },
      {
        title: "By network",
        icon: "mdi-file-document-multiple",
        route: "/explore/search-network",
      },
    ],
  },
  {
    title: "Creation",
    icon: "mdi-pencil-box",
    options: [
      {
        title: "Series",
        icon: "mdi-file-plus",
        route: "/creation/series",
      },
      {
        title: "Grids",
        icon: "mdi-file-document-multiple",
        route: "/creation/grids",
      },
    ],
  },
  {
    title: "Settings",
    icon: "mdi-cog",
    options: [
      {
        title: "Preferences",
        icon: "mdi-tune",
        route: "/settings/preferences",
      },
      {
        title: "Aspect",
        icon: "mdi-account",
        route: "/settings/aspect",
      },
    ],
  },
];

const selectedSection = ref(null);
const router = useRouter();

function selectSection(section) {
  selectedSection.value = section;
}

function goTo(route) {
  router.push(route);
}
</script>

<style scoped>
/* Estilo del submenú desplegable con íconos alineados */
.submenu-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.submenu-icon {
  margin-right: 8px;
}

.submenu-title {
  flex-grow: 1;
  text-align: left;
  font-size: 1rem;
}
/* Estilo del menú principal (iconos) */
.menu-item .v-list-item-title {
  font-size: 0.7rem;
}

/* Estilo del submenú desplegable */
.submenu-item .v-list-item-title {
  font-size: 1rem;
}
.menu-item {
  text-align: center;
}

.submenu-item {
  cursor: pointer;
}
</style>
