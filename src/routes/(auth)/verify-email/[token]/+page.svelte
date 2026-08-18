<script lang="ts">
	let { data } = $props<{ data: { success: boolean; message: string } }>();
</script>

<div class="flex min-h-screen items-center justify-center bg-[#0B0E14] p-6 text-white">
	<div class="w-full max-w-md rounded-2xl border border-[#2A3241] bg-[#151921] p-8 text-center shadow-lg">
		<h1 class="mb-4 text-2xl font-bold">Email Verification</h1>
		
		{#if data.success}
			<div class="mb-6 rounded-lg bg-[#00390f] p-4 text-[#73f382]">
				{data.message}
			</div>
			<a href="/login" class="inline-block rounded-lg bg-[#FF6B4A] px-6 py-2 text-sm font-bold text-[#0B0E14] hover:bg-[#FF8264]">
				Continue to Login
			</a>
		{:else}
			<div class="mb-6 rounded-lg bg-[#93000a] p-4 text-[#ffdad6]">
				{data.message}
			</div>
			<a href="/register" class="inline-block rounded-lg border border-[#2A3241] px-6 py-2 text-sm font-medium hover:bg-[#2A3241]">
				Back to Register
			</a>
		{/if}
	</div>
</div>
