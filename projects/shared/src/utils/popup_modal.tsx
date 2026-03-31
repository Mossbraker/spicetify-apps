import React from "react";

let activeRoot: any = null;
const MODAL_CONTAINER_ID = "spicetify-shared-modal-root";
let previousPopupModalHide: (() => void) | undefined;

function closeModal(): void {
    if (activeRoot) {
        activeRoot.unmount();
        activeRoot = null;
    }
    document.getElementById(MODAL_CONTAINER_ID)?.remove();
    // Restore the original PopupModal.hide that was saved before patching.
    if (previousPopupModalHide !== undefined) {
        // @ts-ignore
        Spicetify.PopupModal.hide = previousPopupModalHide;
        previousPopupModalHide = undefined;
    }
}

// Inline styles guarantee visibility even when Spicetify's CSS class-name mapping
// (semantic → hashed) fails to process the extension JS.  Class names are kept as
// a secondary layer so native Spotify styling applies when the mapping works.

const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    opacity: 1,
};

const modalStyle: React.CSSProperties = {
    backgroundColor: "#121212",
    borderRadius: 8,
    maxWidth: "90vw",
    maxHeight: "80vh",
    width: 600,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 16px 24px rgba(0, 0, 0, 0.3), 0 6px 8px rgba(0, 0, 0, 0.2)",
};

const modalStyleLarge: React.CSSProperties = {
    ...modalStyle,
    width: "80vw",
    maxHeight: "85vh",
};

const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
};

const titleStyle: React.CSSProperties = {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--spice-text, #fff)",
    margin: 0,
};

const closeBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "var(--spice-subtext, #b3b3b3)",
    cursor: "pointer",
    padding: 8,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const bodyStyle: React.CSSProperties = {
    padding: "0 24px 24px",
    overflow: "auto",
    flex: 1,
};

function ModalChrome({
    title,
    content,
    isLarge,
    onClose,
}: {
    title: string;
    content: React.ReactElement;
    isLarge?: boolean;
    onClose: () => void;
}): React.ReactElement {
    const titleId = React.useId();
    const dialogRef = React.useRef<HTMLDivElement>(null);
    const previouslyFocused = React.useRef<Element | null>(null);

    React.useEffect(() => {
        // Save the element that had focus before the modal opened so we can restore it on close.
        previouslyFocused.current = document.activeElement;

        // Focus the first focusable element inside the dialog.
        const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }
            // Focus trap: keep keyboard focus inside the dialog.
            if (e.key === "Tab" && dialogRef.current) {
                const focusables = Array.from(
                    dialogRef.current.querySelectorAll<HTMLElement>(
                        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                    )
                );
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            // Restore focus to the element that was focused before the modal opened.
            if (previouslyFocused.current instanceof HTMLElement) {
                previouslyFocused.current.focus();
            }
        };
    }, [onClose]);

    return (
        <div
            className="GenericModal__overlay"
            style={overlayStyle}
            onMouseDown={(e: React.MouseEvent) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="GenericModal"
                style={isLarge ? modalStyleLarge : modalStyle}
            >
                <div
                    className={
                        isLarge
                            ? "main-embedWidgetGenerator-container"
                            : "main-trackCreditsModal-container"
                    }
                    style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}
                >
                    <div className="main-trackCreditsModal-header" style={headerStyle}>
                        <h1
                            id={titleId}
                            className="TypeElement-cello-textBase-type"
                            data-encore-id="type"
                            style={titleStyle}
                        >
                            {title}
                        </h1>
                        <button
                            className="main-trackCreditsModal-closeBtn"
                            style={closeBtnStyle}
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <svg
                                role="img"
                                height="16"
                                width="16"
                                viewBox="0 0 16 16"
                                aria-hidden="true"
                                fill="currentColor"
                            >
                                <path d="M1.47 1.47a.75.75 0 0 1 1.06 0L8 6.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L9.06 8l5.47 5.47a.75.75 0 1 1-1.06 1.06L8 9.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L6.94 8 1.47 2.53a.75.75 0 0 1 0-1.06z" />
                            </svg>
                        </button>
                    </div>
                    <div className="main-trackCreditsModal-mainSection" style={bodyStyle}>
                        <main className="main-trackCreditsModal-originalCredits">
                            {content}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Display a React element in a modal, bypassing Spicetify.PopupModal.
 *
 * Uses createRoot (React 18+) and renders our own modal chrome with full inline
 * styles so visibility does not depend on Spicetify's CSS class-name mapping.
 */
export function displayPopupModal({
    title,
    content,
    isLarge,
}: {
    title: string;
    content: React.ReactElement;
    isLarge?: boolean;
}): void {
    try {
        closeModal();
        const container = document.createElement("div");
        container.id = MODAL_CONTAINER_ID;
        document.body.appendChild(container);

        // @ts-ignore - createRoot is available on Spicetify.ReactDOM (React 18+/19)
        activeRoot = Spicetify.ReactDOM.createRoot(container);
        activeRoot.render(
            <ModalChrome
                title={title}
                content={content}
                isLarge={isLarge}
                onClose={closeModal}
            />,
        );

        // Save and replace PopupModal.hide so callers that use the Spicetify API also
        // close our custom modal.  The original is restored inside closeModal().
        // @ts-ignore
        previousPopupModalHide = Spicetify.PopupModal.hide as (() => void) | undefined;
        // @ts-ignore
        Spicetify.PopupModal.hide = closeModal;
    } catch (e) {
        console.error("[popup_modal] ERROR:", e);
    }
}
