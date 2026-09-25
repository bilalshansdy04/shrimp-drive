export function lazyLoad(node: HTMLElement, { rootMargin = '200px' } = {}) {
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					node.dispatchEvent(new CustomEvent('intersect'));
					observer.unobserve(node);
				}
			});
		},
		{
			rootMargin
		}
	);

	observer.observe(node);

	return {
		destroy() {
			observer.unobserve(node);
		}
	};
}
