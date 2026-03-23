import React from "react";

interface ReorderItem {
	uri: string;
	name: string;
	artist: string;
	imageUrl?: string;
}

interface ReorderModalProps {
	items: ReorderItem[];
	onSave: (uris: string[]) => void;
	onReset?: () => void;
}

const ReorderModal = ({ items: initialItems, onSave, onReset }: ReorderModalProps) => {
	const [items, setItems] = React.useState(initialItems);
	const dragIndexRef = React.useRef<number | null>(null);
	const [dropTarget, setDropTarget] = React.useState<number | null>(null);

	const handleDragStart = (index: number) => (e: React.DragEvent) => {
		dragIndexRef.current = index;
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (index: number) => (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setDropTarget(index);
	};

	const handleDrop = (targetIndex: number) => (e: React.DragEvent) => {
		e.preventDefault();
		const sourceIndex = dragIndexRef.current;
		if (sourceIndex === null || sourceIndex === targetIndex) {
			setDropTarget(null);
			return;
		}

		setItems((prev) => {
			const updated = [...prev];
			const [moved] = updated.splice(sourceIndex, 1);
			updated.splice(targetIndex, 0, moved);
			return updated;
		});
		dragIndexRef.current = null;
		setDropTarget(null);
	};

	const handleDragEnd = () => {
		dragIndexRef.current = null;
		setDropTarget(null);
	};

	const handleSave = () => {
		onSave(items.map((item) => item.uri));
		Spicetify.PopupModal.hide();
	};

	const handleReset = () => {
		onReset?.();
		Spicetify.PopupModal.hide();
	};

	return (
		<div className="reorder-modal">
			<div className="reorder-modal-list" role="list" aria-label="Album order">
				{items.map((item, index) => (
					<div
						key={item.uri}
						className={`reorder-modal-row ${dropTarget === index ? "reorder-drop-target" : ""}`}
						draggable
						role="listitem"
						aria-label={`${item.name} by ${item.artist}`}
						onDragStart={handleDragStart(index)}
						onDragOver={handleDragOver(index)}
						onDrop={handleDrop(index)}
						onDragEnd={handleDragEnd}
					>
						<span className="reorder-modal-drag-handle">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
								<path d="M2 4h12v1.5H2zM2 7.25h12v1.5H2zM2 10.5h12v1.5H2z" />
							</svg>
						</span>
						{item.imageUrl && (
							<img
								className="reorder-modal-image"
								src={item.imageUrl}
								alt=""
								width={32}
								height={32}
							/>
						)}
						<span className="reorder-modal-name">{item.name}</span>
						<span className="reorder-modal-artist">{item.artist}</span>
					</div>
				))}
			</div>
			<div className="reorder-modal-actions">
				<button type="button" className="reorder-modal-save" onClick={handleSave}>
					Save Order
				</button>
				{onReset && (
					<button type="button" className="reorder-modal-reset" onClick={handleReset}>
						Reset to Default
					</button>
				)}
			</div>
		</div>
	);
};

export default ReorderModal;
