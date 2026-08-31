<script lang="ts">
	import { page } from '$app/stores';
	import {
		ArrowLeft,
		ZoomIn,
		ZoomOut,
		RotateCw,
		SquarePen,
		Info,
		Share2,
		Trash2,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';

	// Interactive effect for main photo (similar to the vanilla JS in design)
	let photoElement: HTMLImageElement;

	function handleMouseMove(e: MouseEvent) {
		if (!photoElement) return;
		const { left, top, width, height } = photoElement.getBoundingClientRect();
		const x = (e.clientX - left) / width;
		const y = (e.clientY - top) / height;

		photoElement.style.transform = `scale(1.02) translate(${(x - 0.5) * -10}px, ${(y - 0.5) * -10}px)`;
	}

	function handleMouseLeave() {
		if (!photoElement) return;
		photoElement.style.transform = 'scale(1) translate(0, 0)';
	}
</script>

<!-- Use fixed full-screen overlay to cover the standard app layout -->
<div class="fixed inset-0 z-[100] flex flex-col bg-[#0B0E14] font-sans text-white">
	<!-- Top Toolbar -->
	<header
		class="z-50 flex h-16 shrink-0 items-center justify-between border-b border-[#32353C] bg-[#191C22] px-6"
	>
		<!-- Left: Back Action & Details -->
		<div class="flex items-center gap-4">
			<a
				href="/photo"
				class="group flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#272A31]"
			>
				<ArrowLeft class="text-gray-400 group-hover:text-[#FF6B4A]" size={24} />
			</a>
			<div class="flex flex-col">
				<span class="text-sm font-medium">Photo {$page.params.id}</span>
				<span class="text-xs text-gray-400">Yesterday, 14:32 • 4.2 MB</span>
			</div>
		</div>

		<!-- Center: Tool Actions -->
		<div class="flex items-center gap-2">
			<button
				class="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[#272A31]"
			>
				<ZoomIn class="text-gray-400 group-hover:text-white" size={20} />
			</button>
			<button
				class="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[#272A31]"
			>
				<ZoomOut class="text-gray-400 group-hover:text-white" size={20} />
			</button>
			<div class="mx-1 h-6 w-[1px] bg-[#32353C]"></div>
			<button
				class="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[#272A31]"
			>
				<RotateCw class="text-gray-400 group-hover:text-white" size={20} />
			</button>
			<button
				class="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[#272A31]"
			>
				<SquarePen class="text-gray-400 group-hover:text-white" size={20} />
			</button>
		</div>

		<!-- Right: Global Actions -->
		<div class="flex items-center gap-2">
			<button
				class="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[#272A31]"
			>
				<Info class="text-gray-400 group-hover:text-white" size={20} />
			</button>
			<button
				class="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[#272A31]"
			>
				<Share2 class="text-gray-400 group-hover:text-white" size={20} />
			</button>
			<button
				class="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[#93000A]/20"
			>
				<Trash2 class="text-gray-400 group-hover:text-red-400" size={20} />
			</button>
		</div>
	</header>

	<!-- Main Canvas Area -->
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<main
		class="group/canvas relative flex flex-1 items-center justify-center overflow-hidden bg-[#0B0E14]"
		on:mousemove={handleMouseMove}
		on:mouseleave={handleMouseLeave}
		role="region"
	>
		<!-- Navigation Arrow Left -->
		<button
			class="absolute top-1/2 left-8 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#32353C] bg-[#272A31]/80 opacity-0 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)] backdrop-blur transition-all duration-300 group-hover/canvas:opacity-100 hover:bg-[#32353C]"
		>
			<ChevronLeft size={24} />
		</button>

		<!-- Main Image -->
		<div class="relative flex h-full w-full items-center justify-center p-12">
			<img
				bind:this={photoElement}
				alt="Main View"
				class="max-h-full max-w-full rounded-lg object-contain shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out"
				src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYUhdFdNxnetLoXwxp15O4oI-37GLU_g5qm47XigpsZ9ZojQ_cq1ofSbtg03_9JZmSg7Je4t2Nv0KzJgFIK2kO5GUQgVa3BfG0X8HU1fAYz2saCgYnHspbhd14Nc9ZNv9UMw3TX_lNItQP7QQFqEEs-NxgjB0QRWL6UBDngRj3GG2xL_WQTnC2CCSGd0DZwcrZG33-NzZNcxJ-46l6lqx0sKjroKqgMlL2BY-00JdqhxVjipA6FlNQ"
			/>
		</div>

		<!-- Navigation Arrow Right -->
		<button
			class="absolute top-1/2 right-8 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#32353C] bg-[#272A31]/80 opacity-0 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)] backdrop-blur transition-all duration-300 group-hover/canvas:opacity-100 hover:bg-[#32353C]"
		>
			<ChevronRight size={24} />
		</button>
	</main>

	<!-- Bottom Filmstrip -->
	<footer
		class="z-50 flex h-28 shrink-0 items-center border-t border-[#32353C] bg-[#1D2026] px-6 py-2"
	>
		<div
			class="flex w-full items-center gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#32353C] hover:[&::-webkit-scrollbar-thumb]:bg-[#59413C] [&::-webkit-scrollbar-track]:bg-[#10131A]"
		>
			<!-- Thumbnail 1 -->
			<button
				class="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-[#32353C] opacity-60 transition-colors duration-150 hover:border-gray-400 hover:opacity-100"
			>
				<img
					alt="Thumbnail 1"
					class="h-full w-full object-cover"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRARylR-PH1FsWvhdK1NurvlDTpeh6yu3cRQFCyvhr0ohtAgrcWDuiQOmm1aOXlGLQRAx7Oft50o7PG-kiGcROcsX2Rqe7PTjam9rFTukMjuZKmPHgbf3lk4xJkjvvA1OMoZNq0q7F32a3usFWoPI6l7LUN-rjYvJw2SwfwyXfocp-0sTZ9epaUhrMW85y5KyF3_ARrm7iGPhO4rDBYbdqPP--pwA1IF4JoXE3vKxBng0TiRfuBJFm"
				/>
			</button>

			<!-- Thumbnail 2 -->
			<button
				class="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-[#32353C] opacity-60 transition-colors duration-150 hover:border-gray-400 hover:opacity-100"
			>
				<img
					alt="Thumbnail 2"
					class="h-full w-full object-cover"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPgzBLFzb6hczn4QL0KoN_RmCCaEPobfxLyYsbFjWo_ELihY3b4pdWqAdzgPNtkO73C_XQRj_A6swHjsnY73ZLFQOxq7lqjCEgeYvtLoew_cMQG_U_3nE9IueQwCWNWAJuLWKdonsmLvPy56AKI04ZqFgAksLm7iHhIS1wjQ4yujz3vmKhTkt-YcjQPNOQmEC4hw9fCCulncI2kimLQ-jkHEtcxRirA-9_2wjDrRo9TMAE9_-aQetP"
				/>
			</button>

			<!-- Thumbnail 3 (Active) -->
			<button
				class="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 border-[#FF6B4A] opacity-100 shadow-[0_0_10px_rgba(255,107,74,0.3)] ring-2 ring-[#FF6B4A]/20 transition-all duration-150"
			>
				<img
					alt="Thumbnail 3 Active"
					class="h-full w-full object-cover"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXOB8p-J6SK5Ze5sBGhvRKVkuOmpuj-P2xJWFnyCkLRWYBznLguAkhfSNIAyP4p8MFKozr_vy5QZqkJ75qIuGndwA9_q7qVJrJ1JlQ7vLT94Cl6COpZAuC-DFNH1ISSbtEpdTPhKBV_u6_5qT0C0tqDlrPBY0BMLRfOhl5FbInXVdwCe6Wqvel5YFSgX7X8pdU_eLZQNSKnbhOhKyOvJgLQVat4fYRDBXfHw-Gld4MieBZeO81-eeU"
				/>
				<div class="absolute inset-0 rounded-md ring-1 ring-[#FF6B4A]/50 ring-inset"></div>
			</button>

			<!-- Thumbnail 4 -->
			<button
				class="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-[#32353C] opacity-60 transition-colors duration-150 hover:border-gray-400 hover:opacity-100"
			>
				<img
					alt="Thumbnail 4"
					class="h-full w-full object-cover"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiPvyu_NzKxUrXutWZYcjn5ns98kQRotuH6-Oy1HmutB_nc7AK6wH1j6TywhrUYA_Ymv9fM9uQon7PmW8lRx1sxmG88Hmzvajn8sgo30lBoIZNKcUCK0yUdnKKEaCtIRSxcmjWIeHo0I8VC6P8hP1uTQu4nfoc4_V0fhql6iT8DfahV0Hk4SWQdlqkQj8SwXE9JvvynhhdDGu2Wp-j5ZZ8IBKSOuwW52H5Wqri1-QCNjHVwlSJyjgE"
				/>
			</button>

			<!-- Thumbnail 5 -->
			<button
				class="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-[#32353C] opacity-60 transition-colors duration-150 hover:border-gray-400 hover:opacity-100"
			>
				<img
					alt="Thumbnail 5"
					class="h-full w-full object-cover"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDp6Iak9ndTeDOUv-eofft0R1r4IwftLHVJ-cscPUawcj3mIf1U--Puitb5qdg5-63moqCSo8YpqfN4hEGNAW1QDcOf0Vz0GSqWoJDBsG0-KuhDieozP-gt8jrQYJD1vH9jmbHvFPe5nSGarfOGGxjb-4p5iheQxaW9KbAUmWNxd0j9S3BIegguwN32ZAdOpgo_2EQk5RElmGiIUx1HF2rn7l7vM2_GtWVwWyjwEJIN7-eZzsZ3msH"
				/>
			</button>

			<!-- Thumbnail 6 -->
			<button
				class="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-[#32353C] opacity-60 transition-colors duration-150 hover:border-gray-400 hover:opacity-100"
			>
				<img
					alt="Thumbnail 6"
					class="h-full w-full object-cover"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxKZDNXgE7xjsG_i3Y9w5dH0QWWt6ygjEkEoGeOhcpHlHN0lA4PvyhaNWzX_OQ0osUiJdb4gKiRz4iZRmULAYPJqqSc-54DQnPoqUjDDbGrrp8NH64QVxsWyyrU7pyuQHVLUYUXSxEGq0n9IKCwJrZ_y2W7_fptC7DeonhKkAOMSvJ9ECbngg93R7YPtYPSXl37Wz895dwzMnwW0lQ6AyBm-sZmhm9oQUQBysJOBhajW9DOs8Y6ZbB"
				/>
			</button>

			<!-- Thumbnail 7 -->
			<button
				class="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-[#32353C] opacity-60 transition-colors duration-150 hover:border-gray-400 hover:opacity-100"
			>
				<img
					alt="Thumbnail 7"
					class="h-full w-full object-cover"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmVeksT0u_rI5aC7e4hPP9hwxzy_bkfOuneJTYATmP6wxyA1b6VH-pUMEVxpg1DJQ5SmGKkP2HTupvDfRfkAolKgsdp7UAUb_ZpfNKC-pu4SMqhmlDGqqM7hTr19awqpGwbfGbQdJmukKlQ1B1I13jEYdmXWjhBpP4lotkOc9HtCj7uWsrlkQNz-PAE2q4SArd2PCmqF13qcEGWnHgtdBsvqXrvNcof6xWfeWXvaXEfYXTvTEu0YIs"
				/>
			</button>

			<!-- Thumbnail 8 -->
			<button
				class="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-[#32353C] opacity-60 transition-colors duration-150 hover:border-gray-400 hover:opacity-100"
			>
				<img
					alt="Thumbnail 8"
					class="h-full w-full object-cover"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuBe14q92jp4RIUaeFKGe7bXjjZKVf2HR_80hAj1eQmFXsIYHk8ifSuoB18qxLXVVtJto0jMaMwmPfAYAvTynUHml6kYVQlqysl8c5FhwisRHDiPpjv06W3HfStZLufRzpNaiYIVV-yBPbc3lQxLRsX_PK1qFbi-KVy1P1mxC1RxodhvLmtgOMxZDaoaoXflFATAJ5YFQRJqutMFWF018g0XqKMUWyHNyp-yWNCaZZAD_6u8C3Fus6Q4"
				/>
			</button>
		</div>
	</footer>
</div>
