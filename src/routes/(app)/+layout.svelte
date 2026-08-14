<script lang="ts">
	import {
		Search,
		Filter,
		UploadCloud,
		HardDrive,
		Folder,
		Music,
		Video,
		Image,
		FileText,
		Settings,
		LogOut
	} from 'lucide-svelte';
	import '../../app.css';

	let { children } = $props();
</script>

<div class="flex h-screen w-full overflow-hidden bg-[#0B0E14] text-white">
	<!-- Sidebar -->
	<aside class="flex h-full w-[260px] shrink-0 flex-col border-r border-[#2A3241] bg-[#151921]">
		<!-- Brand -->
		<div class="flex h-[64px] items-center border-b border-[#2A3241] px-6">
			<div class="flex items-center gap-2 text-xl font-bold text-[#FF6B4A]">
				<span>🍤</span>
				<span class="text-white">Shrimp Drive</span>
			</div>
		</div>

		<!-- Navigation -->
		<div class="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
			<!-- Main Links -->
			<nav class="flex flex-col gap-1">
				<a
					href="/dashboard"
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
				>
					<HardDrive size={18} />
					Overview
				</a>
				<a
					href="/drive"
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
				>
					<Folder size={18} />
					File Manager
				</a>
			</nav>

			<!-- Media Hubs -->
			<div>
				<h3 class="mb-2 px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
					Media Hubs
				</h3>
				<nav class="flex flex-col gap-1">
					<a
						href="/music"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
					>
						<Music size={18} />
						Music
					</a>
					<a
						href="/video"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
					>
						<Video size={18} />
						Video
					</a>
					<a
						href="/photo"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
					>
						<Image size={18} />
						Photo
					</a>
					<a
						href="/docs"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
					>
						<FileText size={18} />
						Docs
					</a>
				</nav>
			</div>
		</div>

		<!-- Footer Sidebar -->
		<div class="border-t border-[#2A3241] p-4">
			<div class="mb-4">
				<div class="mb-2 flex justify-between text-xs text-gray-400">
					<span>Storage (Telegram)</span>
					<span>2.4 GB / 8.0 GB</span>
				</div>
				<div class="h-1.5 w-full overflow-hidden rounded-full bg-[#0B0E14]">
					<div class="h-full rounded-full bg-[#FF6B4A]" style="width: 30%;"></div>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<div class="h-10 w-10 rounded-full bg-gradient-to-tr from-[#FF6B4A] to-purple-500"></div>
				<div class="flex-1 overflow-hidden">
					<p class="truncate text-sm font-medium">User Account</p>
				</div>
				<button class="p-1 text-gray-400 hover:text-white">
					<Settings size={16} />
				</button>
				<button class="p-1 text-gray-400 hover:text-white">
					<LogOut size={16} />
				</button>
			</div>
		</div>
	</aside>

	<!-- Main Canvas -->
	<main class="flex min-w-0 flex-1 flex-col overflow-hidden">
		<!-- Header -->
		<header
			class="z-10 flex h-[64px] shrink-0 items-center justify-between border-b border-[#2A3241] bg-[#0B0E14]/80 px-6 backdrop-blur"
		>
			<div class="flex flex-1 items-center gap-4">
				<div class="relative w-96">
					<Search size={18} class="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
					<input
						type="text"
						placeholder="Search files, metadata..."
						class="h-10 w-full rounded-full border border-[#2A3241] bg-[#151921] pr-4 pl-10 text-sm text-white placeholder-gray-500 focus:border-[#FF6B4A] focus:ring-1 focus:ring-[#FF6B4A] focus:outline-none"
					/>
				</div>

				<div class="hidden items-center gap-2 lg:flex">
					<button
						class="flex items-center gap-1 rounded-full border border-[#2A3241] bg-[#151921] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:text-white"
					>
						All
					</button>
					<button
						class="flex items-center gap-1 rounded-full border border-[#2A3241] bg-[#151921] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:text-white"
					>
						Audio
					</button>
					<button
						class="flex items-center gap-1 rounded-full border border-[#2A3241] bg-[#151921] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:text-white"
					>
						Video
					</button>
				</div>
			</div>

			<div class="ml-auto flex items-center gap-4 pl-4">
				<button
					class="flex items-center gap-2 rounded-lg bg-[#FF6B4A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#FF8266]"
				>
					<UploadCloud size={18} />
					Upload File
				</button>
			</div>
		</header>

		<!-- Dynamic Canvas -->
		<div class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</div>
	</main>
</div>
