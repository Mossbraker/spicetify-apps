// biome-ignore lint:
import React from "react";

export interface AddMenuItem {
	label: string;
	iconPath: string;
	onClick: () => void;
}

interface AddButtonProps {
	menuItems: AddMenuItem[];
}

function AddIcon(): React.ReactElement<SVGElement> {
	return (
		<Spicetify.ReactComponent.IconComponent
			semanticColor="textSubdued"
			dangerouslySetInnerHTML={{
				__html:
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M15.25 8a.75.75 0 0 1-.75.75H8.75v5.75a.75.75 0 0 1-1.5 0V8.75H1.5a.75.75 0 0 1 0-1.5h5.75V1.5a.75.75 0 0 1 1.5 0v5.75h5.75a.75.75 0 0 1 .75.75z"></path></svg>',
			}}
			iconSize={16}
		/>
	);
}

function AddButton({ menuItems }: AddButtonProps): React.ReactElement<HTMLButtonElement> {
	const [isOpen, setIsOpen] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("click", handleClickOutside, true);
		return () => document.removeEventListener("click", handleClickOutside, true);
	}, [isOpen]);

	return (
		<div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
			<Spicetify.ReactComponent.TooltipWrapper label={"Add"} placement="top">
				<button
					className="stats-icon-button"
					type="button"
					aria-label="Add"
					onClick={() => setIsOpen((v) => !v)}
				>
					<AddIcon />
				</button>
			</Spicetify.ReactComponent.TooltipWrapper>
			{isOpen && (
				<div className="library-addmenu-dropdown">
					{menuItems.map((item) => (
						<button
							key={item.label}
							className="library-addmenu-item"
							type="button"
							onClick={() => { setIsOpen(false); item.onClick(); }}
						>
							<span
								className="library-addmenu-icon"
								dangerouslySetInnerHTML={{
									__html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">${item.iconPath}</svg>`,
								}}
							/>
							<span>{item.label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export default AddButton;
