<script lang="ts">
	import { ChevronDown, ChevronUp, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-svelte';
	import { uploadState } from '$lib/client/uploadState.svelte';

	let isExpanded = $state(true);
</script>

{#if uploadState.isOpen}
	<div class="fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-xl border border-[#2A3241] bg-[#151921] shadow-2xl transition-all duration-300 ease-in-out">
		<!-- Header -->
		<div class="flex items-center justify-between bg-[#1A202A] px-4 py-3">
			<div class="flex flex-col">
				<span class="font-semibold text-white">
					Uploading {uploadState.totalItems} item{uploadState.totalItems !== 1 ? 's' : ''}
				</span>
				<span class="text-xs text-gray-400">
					{uploadState.completedItems} / {uploadState.totalItems} completed
				</span>
			</div>
			<div class="flex items-center gap-2">
				<button
					class="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
					onclick={() => (isExpanded = !isExpanded)}
				>
					{#if isExpanded}
						<ChevronDown size={18} />
					{:else}
						<ChevronUp size={18} />
					{/if}
				</button>
				<button
					class="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
					onclick={() => (uploadState.isOpen = false)}
				>
					<X size={18} />
				</button>
			</div>
		</div>

		<!-- Body -->
		{#if isExpanded}
			<div class="flex max-h-64 flex-col gap-1 overflow-y-auto p-2">
				{#each uploadState.items as item (item.id)}
					<div class="flex items-center justify-between rounded-lg p-2 hover:bg-[#1A202A]">
						<div class="flex min-w-0 flex-1 flex-col">
							<span class="truncate text-sm font-medium text-white" title={item.file.name}>
								{item.file.name}
							</span>
							<div class="mt-1 flex items-center gap-2">
								<!-- Status Text -->
								<span class="text-xs text-gray-400">
									{#if item.status === 'idle'}
										Queueing...
									{:else if item.status === 'extracting_thumb'}
										Processing...
									{:else if item.status === 'uploading'}
										Uploading {item.progress}%
									{:else if item.status === 'queued_for_sending'}
										In queue for processing
									{:else if item.status === 'cooldown' || item.status === 'wait_send'}
										Cooling down...
									{:else if item.status === 'sending'}
										Sending to Telegram...
									{:else if item.status === 'completed'}
										Completed
									{:else if item.status === 'error'}
										<span class="text-red-400">{item.errorMsg || 'Failed'}</span>
									{/if}
								</span>
							</div>
						</div>

						<!-- Status Icon -->
						<div class="ml-3 flex shrink-0 items-center justify-center">
							{#if item.status === 'idle'}
								<div class="h-4 w-4 rounded-full border-2 border-gray-600"></div>
							{:else if item.status === 'queued_for_sending' || item.status === 'cooldown' || item.status === 'wait_send'}
								<div class="h-4 w-4 rounded-full border-2 border-gray-500 border-dashed"></div>
							{:else if item.status === 'sending'}
								<Loader2 size={18} class="animate-spin text-blue-400" />
							{:else if item.status === 'extracting_thumb' || item.status === 'uploading'}
								<div class="relative flex h-5 w-5 items-center justify-center">
									<!-- Progress Ring -->
									<svg class="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
										<path
											class="text-[#2A3241]"
											d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
											fill="none"
											stroke="currentColor"
											stroke-width="4"
										/>
										<path
											class="text-blue-500 transition-all duration-300"
											stroke-dasharray="100, 100"
											stroke-dashoffset={100 - item.progress}
											d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
											fill="none"
											stroke="currentColor"
											stroke-width="4"
										/>
									</svg>
								</div>
							{:else if item.status === 'completed'}
								<CheckCircle size={18} class="text-green-500" />
							{:else if item.status === 'error'}
								<AlertCircle size={18} class="text-red-500" />
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
