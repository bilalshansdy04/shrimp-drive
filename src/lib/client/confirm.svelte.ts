export const confirmModal = $state({
	show: false,
	message: '',
	confirmText: 'Delete',
	onConfirm: () => {},
	onCancel: () => {}
});

export function askConfirm(message: string, confirmText: string = 'Delete'): Promise<boolean> {
	return new Promise((resolve) => {
		confirmModal.message = message;
		confirmModal.confirmText = confirmText;
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
