export const confirmModal = $state({
	show: false,
	message: '',
	onConfirm: () => {},
	onCancel: () => {}
});

export function askConfirm(message: string): Promise<boolean> {
	return new Promise((resolve) => {
		confirmModal.message = message;
		confirmModal.show = true;
		confirmModal.onConfirm = () => {
			confirmModal.show = false;
			resolve(true);
		};
		confirmModal.onCancel = () => {
			confirmModal.show = false;
			resolve(false);
		};
	});
}
