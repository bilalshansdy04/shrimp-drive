<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-[#0B0E14] text-white">
	<div class="mx-auto max-w-3xl px-6 py-12">
		<a href="/" class="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
			<ArrowLeft size={16} /> Back to Home
		</a>
		
		<h1 class="mb-8 text-4xl font-bold text-[#FF6B4A]">About Shrimp Drive</h1>
		
		<div class="prose prose-invert prose-orange max-w-none">
			<p class="text-lg text-gray-300">
				Shrimp Drive is a personal, self-hosted file storage solution that uses Telegram as its backend infrastructure. 
				This allows you to store unlimited files for free without worrying about traditional storage limits.
			</p>
			
			<h2 class="mt-8 text-2xl font-semibold">How It Works</h2>
			<p class="text-gray-400">
				When you upload a file to Shrimp Drive, it connects to a Telegram bot you control and uploads the file to a private Telegram channel. 
				Shrimp Drive then stores the metadata (filename, size, Telegram file ID) in a local database. When you want to download the file, 
				Shrimp Drive fetches it from Telegram and streams it back to you.
			</p>

			<h2 class="mt-8 text-2xl font-semibold">Security & Encryption</h2>
			<p class="text-gray-400">
				Shrimp Drive offers client-side encryption. If enabled, your files are encrypted before they leave your device and before they are uploaded to Telegram. 
				Only you hold the keys to decrypt them, meaning even if someone gains access to your Telegram channel, they cannot read your files.
			</p>

			<h2 class="mt-8 text-2xl font-semibold">Open Source</h2>
			<p class="text-gray-400">
				Shrimp Drive is open source. You can view the code, report issues, and contribute on GitHub. We believe in transparency and giving users full control over their data.
			</p>
		</div>
	</div>
</div>
