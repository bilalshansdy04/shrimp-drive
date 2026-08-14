<script lang="ts">
  import { page } from "$app/stores";
</script>

<div>
  <h1 class="text-2xl font-bold mb-4">Photo Viewer</h1>
  <p class="text-gray-400">Viewing photo ID: {$page.params.id}</p>
</div>
