<template>
  <v-container>
    <h1>Login</h1>
    <p>Please log in to access the dashboard.</p>
    <v-form>
      <v-text-field label="Email" required></v-text-field>
      <v-text-field label="Password" type="password" required></v-text-field>
      <v-btn type="submit" color="primary">Login</v-btn>
    </v-form>
  </v-container>
</template>

<script setup>
//
</script>
