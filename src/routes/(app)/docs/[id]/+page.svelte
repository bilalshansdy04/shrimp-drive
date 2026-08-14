<script lang="ts">
  import { page } from "$app/stores";
</script>

<div>
  <h1 class="text-2xl font-bold mb-4">Document Viewer (PDF)</h1>
  <p class="text-gray-400">Viewing document ID: {$page.params.id}</p>
</div>
