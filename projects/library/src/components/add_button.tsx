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
	const triggerRef = React.useRef<HTMLButtonElement>(null);
	const menuRef = React.useRef<HTMLDivElement>(null);
	const menuId = React.useId();

	const focusMenuItem = React.useCallback((index: number) => {
		const items = menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']");
		items?.[index]?.focus();
	}, []);

	const closeMenu = React.useCallback((focusTrigger = true) => {
		setIsOpen(false);
		if (focusTrigger) {
			requestAnimationFrame(() => triggerRef.current?.focus());
		}
	}, []);

	React.useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				closeMenu(false);
			}
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				closeMenu();
			}
		};
		document.addEventListener("click", handleClickOutside, true);
		document.addEventListener("keydown", handleKeyDown, true);
		requestAnimationFrame(() => focusMenuItem(0));
		return () => {
			document.removeEventListener("click", handleClickOutside, true);
			document.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [closeMenu, focusMenuItem, isOpen]);

	const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (menuItems.length === 0) return;

		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			setIsOpen(true);
			requestAnimationFrame(() => focusMenuItem(e.key === "ArrowUp" ? menuItems.length - 1 : 0));
		}
	};

	const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']") ?? []);
		const currentIndex = items.findIndex((item) => item === document.activeElement);

		if (e.key === "Escape") {
			e.preventDefault();
			closeMenu();
			return;
		}

		if (e.key === "Tab") {
			closeMenu(false);
			return;
		}

		if (items.length === 0) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
			items[nextIndex]?.focus();
		}

		if (e.key === "ArrowUp") {
			e.preventDefault();
			const nextIndex = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
			items[nextIndex]?.focus();
		}

		if (e.key === "Home") {
			e.preventDefault();
			items[0]?.focus();
		}

		if (e.key === "End") {
			e.preventDefault();
			items[items.length - 1]?.focus();
		}
	};

	return (
		<div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
			<Spicetify.ReactComponent.TooltipWrapper label={"Add"} placement="top">
				<button
					ref={triggerRef}
					className="stats-icon-button"
					type="button"
					aria-label="Add"
					aria-haspopup="menu"
					aria-expanded={isOpen}
					aria-controls={isOpen ? menuId : undefined}
					onClick={() => setIsOpen((v) => !v)}
					onKeyDown={onTriggerKeyDown}
				>
					<AddIcon />
				</button>
			</Spicetify.ReactComponent.TooltipWrapper>
			{isOpen && (
				<div
					ref={menuRef}
					id={menuId}
					className="library-addmenu-dropdown"
					role="menu"
					aria-label="Add options"
					onKeyDown={onMenuKeyDown}
				>
					{menuItems.map((item) => (
						<button
							key={item.label}
							className="library-addmenu-item"
							type="button"
							role="menuitem"
							onClick={() => {
								closeMenu(false);
								item.onClick();
							}}
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
