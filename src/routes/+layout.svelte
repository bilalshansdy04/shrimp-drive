<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { beforeNavigate, afterNavigate } from '$app/navigation';

	let { children } = $props();

	// Slim Progress Bar state
	let progress = $state(0);
	let visible = $state(false);
	let trickleInterval: ReturnType<typeof setInterval>;

	beforeNavigate(() => {
		visible = true;
		progress = 15;
		clearInterval(trickleInterval);
		trickleInterval = setInterval(() => {
			if (progress < 90) {
				// Random increment between 2 and 8
				progress += Math.random() * 6 + 2; 
			}
		}, 300);
	});

	afterNavigate(() => {
		clearInterval(trickleInterval);
		progress = 100;
		setTimeout(() => {
			visible = false;
			setTimeout(() => {
				progress = 0;
			}, 300); // Wait for fade out transition before resetting width
		}, 300);
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Top Loading Progress Bar -->
<div 
	class="fixed top-0 left-0 h-1 bg-primary z-[99999] transition-all duration-300 ease-out"
	style="width: {progress}%; opacity: {visible ? 1 : 0}; pointer-events: none;"
>
	<!-- Glow effect on the leading edge -->
	<div class="absolute right-0 top-0 h-full w-24 shadow-[0_0_12px_#FF6B4A,0_0_6px_#FF6B4A] opacity-100 rotate-3 translate-x-1 -translate-y-0.5"></div>
</div>

{@render children()}
