<template>
  <global-footer class="footer custom-render">
    <template v-slot:links></template>
    <template v-slot:copyright>
      Copyright © 2023
      <a href="http://www.openhubs.com" target="_blank">openhubs.com</a>
      . All rights reserved.
    </template>
  </global-footer>
</template>

<script>
export default {
  name: 'ProGlobalFooter',
}
</script>
