<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-[#0B0E14] text-white">
	<div class="mx-auto max-w-3xl px-6 py-12">
		<a href="/" class="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
			<ArrowLeft size={16} /> Back to Home
		</a>
		
		<h1 class="mb-8 text-4xl font-bold text-[#FF6B4A]">Privacy Policy</h1>
		
		<div class="prose prose-invert prose-orange max-w-none">
			<p class="text-gray-400">Last updated: August 2026</p>

			<h2 class="mt-8 text-2xl font-semibold">1. Data Collection</h2>
			<p class="text-gray-400">
				Shrimp Drive collects minimal data required to operate the service. This includes your email address, username, and encrypted passwords. We do not track your browsing habits or sell your data to third parties.
			</p>

			<h2 class="mt-8 text-2xl font-semibold">2. File Storage and Privacy</h2>
			<p class="text-gray-400">
				Your files are stored on Telegram's servers through a private channel that you control. Shrimp Drive acts as an interface. If you enable encryption, your files are encrypted on your device before they are sent to Telegram, meaning neither Shrimp Drive, Telegram, nor anyone else can access your data without your password.
			</p>

			<h2 class="mt-8 text-2xl font-semibold">3. Cookies and Local Storage</h2>
			<p class="text-gray-400">
				We use cookies solely for authentication purposes (keeping you logged in). We do not use third-party tracking cookies. Local storage may be used to cache encryption keys securely during your session.
			</p>

			<h2 class="mt-8 text-2xl font-semibold">4. Third-Party Services</h2>
			<p class="text-gray-400">
				We use Google OAuth for authentication if you choose to sign in with Google. We also use Telegram's API for file storage. Please refer to their respective privacy policies for more information on how they handle your data.
			</p>
			
			<h2 class="mt-8 text-2xl font-semibold">5. Contact</h2>
			<p class="text-gray-400">
				If you have any questions about this Privacy Policy, please contact the instance administrator.
			</p>
		</div>
	</div>
</div>
