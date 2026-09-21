import { toast } from 'svelte-sonner';
import { askConfirm } from '$lib/client/confirm.svelte';

export async function confirmDelete(
	itemName: string,
	onDelete: () => Promise<boolean>
): Promise<boolean> {
	if (!(await askConfirm(`Delete ${itemName}? This cannot be undone.`))) {
		return false;
	}

	const tid = toast.loading(`Deleting ${itemName}...`);
	try {
		const success = await onDelete();
		if (success) {
			toast.success(`${itemName} deleted`, { id: tid });
		} else {
			toast.dismiss(tid);
		}
		return success;
	} catch (error) {
		toast.error(`Failed to delete ${itemName}`, { id: tid });
		console.error(error);
		return false;
	}
}

export async function confirmDeleteMultiple(
	count: number,
	onDelete: () => Promise<boolean>
): Promise<boolean> {
	if (!(await askConfirm(`Delete ${count} item${count > 1 ? 's' : ''}? This cannot be undone.`))) {
		return false;
	}

	const tid = toast.loading(`Deleting ${count} items...`);
	try {
		const success = await onDelete();
		if (success) {
			toast.success(`${count} item${count > 1 ? 's' : ''} deleted`, { id: tid });
		} else {
			toast.dismiss(tid);
		}
		return success;
	} catch (error) {
		toast.error(`Failed to delete items`, { id: tid });
		console.error(error);
		return false;
	}
}
