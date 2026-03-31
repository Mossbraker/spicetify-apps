import React from "react";
import type { LastFMMinifiedTrack, SpotifyMinifiedTrack } from "../types/stats_types";
import { formatNumber } from "../pages/charts";
import { searchAndNavigate } from "../utils/spotify_search";

type MenuItemDef = { label: string; onClick: () => void; divider?: boolean };

const TrackContextMenu = ({
	x,
	y,
	items,
	onClose,
}: {
	x: number;
	y: number;
	items: MenuItemDef[];
	onClose: () => void;
}) => {
	const ref = React.useRef<HTMLUListElement>(null);

	React.useEffect(() => {
		// Focus the first menu item when the menu opens.
		const firstItem = ref.current?.querySelector<HTMLElement>('[role="menuitem"]');
		firstItem?.focus();

		const onMouseDown = (e: MouseEvent) => {
			if (!ref.current?.contains(e.target as Node)) onClose();
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
				return;
			}
			// Arrow key navigation between menu items.
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				const items = Array.from(
					ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
				);
				if (items.length === 0) return;
				const idx = items.indexOf(document.activeElement as HTMLElement);
				if (e.key === "ArrowDown") {
					items[(idx + 1) % items.length].focus();
				} else {
					items[(idx - 1 + items.length) % items.length].focus();
				}
			}
		};
		document.addEventListener("mousedown", onMouseDown, true);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("mousedown", onMouseDown, true);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [onClose]);

	// @ts-ignore - createPortal is available on Spicetify.ReactDOM
	return Spicetify.ReactDOM.createPortal(
		<ul
			ref={ref}
			className="main-contextMenu-menu"
			role="menu"
			style={{ position: "fixed", left: x, top: y, zIndex: 9999 }}
			onContextMenu={(e) => { e.preventDefault(); }}
		>
			{items.map((item, i) => (
				<React.Fragment key={i}>
					{item.divider && <li role="separator" className="main-contextMenu-divider" />}
					<li role="presentation">
						<button
							role="menuitem"
							tabIndex={0}
							className="main-contextMenu-menuItemButton"
							onClick={() => { item.onClick(); onClose(); }}
						>
							{item.label}
						</button>
					</li>
				</React.Fragment>
			))}
		</ul>,
		document.body
	);
};

const ArtistLink = ({ name, uri, index, length }: { name: string; uri: string; index: number; length: number }) => {
	const isLastFm = uri.startsWith("https://www.last.fm/");
	const config = window.SpicetifyStats?.ConfigWrapper?.Config;
	const preferSpotify = isLastFm && config?.["prefer-spotify-links"] === true;

	return (
		<>
			{preferSpotify ? (
				<button
					type="button"
					className="stats-artistLinkButton"
					draggable="true"
					dir="auto"
					tabIndex={-1}
					onClick={() => {
						searchAndNavigate("artist", name, uri);
					}}
				>
					{name}
				</button>
			) : (
				<a draggable="true" dir="auto" href={uri} tabIndex={-1}>
					{name}
				</a>
			)}
			{index === length ? null : ", "}
		</>
	);
};

const ExplicitBadge = React.memo(() => {
	return (
		<span aria-label="Explicit" className="x-explicit-label" title="Explicit">
			<span className="x-explicit-icon">E</span>
		</span>
	);
});

const TrackArtwork = ({ image, name }: { image?: string; name: string }) => {
	const [imageFailed, setImageFailed] = React.useState(false);
	const fallbackLabel = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "?";

	if (!image || imageFailed) {
		return <div className="stats-trackRowImageFallback">{fallbackLabel}</div>;
	}

	return (
		<img
			aria-hidden="true"
			draggable="false"
			loading="lazy"
			src={image}
			alt=""
			className="main-image-image main-trackList-rowImage main-image-loaded"
			width="40"
			height="40"
			onError={() => setImageFailed(true)}
		/>
	);
};

const LikedIcon = ({ active, uri }: { active: boolean; uri: string }) => {
	const [liked, setLiked] = React.useState<boolean>(active);

	const toggleLike = () => {
		if (liked) {
			Spicetify.Platform.LibraryAPI.remove({ uris: [uri] });
		} else {
			Spicetify.Platform.LibraryAPI.add({ uris: [uri] });
		}
		setLiked(!liked);
	};

	React.useEffect(() => {
		setLiked(active);
	}, [active]);

	return (
		<Spicetify.ReactComponent.TooltipWrapper
			label={liked ? "Remove from your library" : "Save to your library"}
			placement="top"
		>
			<button
				type="button"
				role="switch"
				aria-checked={liked}
				aria-label={liked ? "Remove from your library" : "Save to your library"}
				onClick={toggleLike}
				className={
					liked
						? "main-addButton-button main-trackList-rowHeartButton main-addButton-active"
						: "main-addButton-button main-trackList-rowHeartButton"
				}
				tabIndex={-1}
			>
				<svg
					role="img"
					height="16"
					width="16"
					aria-hidden="true"
					viewBox="0 0 16 16"
					data-encore-id="icon"
					className="Svg-img-16 Svg-img-16-icon Svg-img-icon Svg-img-icon-small"
				>
					<path
						d={
							liked
								? "M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.577z"
								: "M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-.605-.463L1.348 8.309A4.582 4.582 0 0 1 1.689 2zm3.158.252A3.082 3.082 0 0 0 2.49 7.337l.005.005L7.8 13.664a.264.264 0 0 0 .311.069.262.262 0 0 0 .09-.069l5.312-6.33a3.043 3.043 0 0 0 .68-2.573 3.118 3.118 0 0 0-2.551-2.463 3.079 3.079 0 0 0-2.612.816l-.007.007a1.501 1.501 0 0 1-2.045 0l-.009-.008a3.082 3.082 0 0 0-2.121-.861z"
						}
					/>
				</svg>
			</button>
		</Spicetify.ReactComponent.TooltipWrapper>
	);
};

const DraggableComponent = ({
	uri,
	title,
	...props
}: { uri: string; title: string } & React.HTMLProps<HTMLDivElement>) => {
	const isSpotifyUri = uri.startsWith("spotify:");
	const dragHandler = isSpotifyUri ? Spicetify.ReactHook.DragHandler?.([uri], title) : undefined;
	return (
		<div onDragStart={dragHandler} draggable={isSpotifyUri} {...props}>
			{props.children}
		</div>
	);
};

function playAndQueue(uri: string) {
	if (!uri.startsWith("spotify:")) return;
	Spicetify.Player.playUri(uri);
}

type TrackRowProps = (SpotifyMinifiedTrack | LastFMMinifiedTrack) & { index: number; uris: string[] };

const TrackRow = (props: TrackRowProps) => {
	const isSpotifyTrack = props.type === "spotify";
	const explicit = isSpotifyTrack ? props.explicit : false;
	const albumUri = isSpotifyTrack ? props.album.uri : undefined;
	const albumName = isSpotifyTrack ? props.album.name : "Unknown";
	const liked = isSpotifyTrack && "liked" in props ? Boolean(props.liked) : false;

	const isSpotifyUri = props.uri.startsWith("spotify:");

	const [menuPos, setMenuPos] = React.useState<{ x: number; y: number } | null>(null);
	const closeMenu = React.useCallback(() => setMenuPos(null), []);

	const menuItems: MenuItemDef[] = [];
	if (isSpotifyUri) {
		menuItems.push({ label: "Play", onClick: () => Spicetify.Player.playUri(props.uri) });
		menuItems.push({ label: "Add to queue", onClick: () => Spicetify.addToQueue?.([{ uri: props.uri }]) });
		menuItems.push({
			label: "Go to song",
			divider: true,
			onClick: () => { const id = props.uri.split(":")[2]; Spicetify.Platform.History.push(`/track/${id}`); },
		});
		if (props.artists?.[0]?.uri?.startsWith("spotify:")) {
			menuItems.push({
				label: "Go to artist",
				onClick: () => { const id = props.artists[0].uri.split(":")[2]; Spicetify.Platform.History.push(`/artist/${id}`); },
			});
		}
		if (albumUri?.startsWith("spotify:")) {
			menuItems.push({
				label: "Go to album",
				onClick: () => { const id = albumUri!.split(":")[2]; Spicetify.Platform.History.push(`/album/${id}`); },
			});
		}
		menuItems.push({
			label: "Copy song link",
			divider: true,
			onClick: () => { const id = props.uri.split(":")[2]; Spicetify.Platform.ClipboardAPI?.copy(`https://open.spotify.com/track/${id}`); },
		});
	} else {
		menuItems.push({ label: "Copy link", onClick: () => Spicetify.Platform.ClipboardAPI?.copy(props.uri) });
	}

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		setMenuPos({ x: e.clientX, y: e.clientY });
	};

	const handleMoreClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
		// Toggle: if the menu is already open at this button's position, close it.
		if (menuPos && menuPos.x === rect.left && menuPos.y === rect.bottom) {
			closeMenu();
		} else {
			setMenuPos({ x: rect.left, y: rect.bottom });
		}
	};

	const ArtistLinks = props.artists.map((artist, index) => {
		return <ArtistLink key={artist.uri} index={index} length={props.artists.length - 1} name={artist.name} uri={artist.uri} />;
	});

	return (
		<div role="row" aria-rowindex={2} aria-selected="false" onContextMenu={handleContextMenu}>
				<DraggableComponent
						uri={props.uri}
						title={`${props.name} • ${props.artists.map((artist) => artist.name).join(", ")}`}
						className="main-trackList-trackListRow main-trackList-trackListRowGrid"
						role="presentation"
						onClick={(event) => event.detail === 2 && isSpotifyUri && playAndQueue(props.uri)}
						style={{
							height: 56,
							gridTemplateColumns: "[index] var(--tracklist-index-column-width,16px) [first] minmax(120px,var(--col1,6fr)) [var1] minmax(120px,var(--col2,4fr)) [var2] minmax(120px,var(--col3,3fr)) [last] minmax(120px,var(--col4,1fr))"
						}}
					>
						<div className="main-trackList-rowSectionIndex" role="gridcell" aria-colindex={1} tabIndex={-1}>
							{/* @ts-ignore - needs uri prop to work with playlist-labels extension*/}
							<div uri={props.uri} className="main-trackList-rowMarker">
								<span className="TypeElement-ballad-type main-trackList-number" data-encore-id="type">
									{props.index}
								</span>
								<Spicetify.ReactComponent.TooltipWrapper
									label={`Play ${props.name} by ${props.artists.map((artist) => artist.name).join(", ")}`}
									placement="top"
								>
									<button
										type="button"
										className="main-trackList-rowImagePlayButton"
										aria-label={`Play ${props.name}`}
										tabIndex={-1}
										onClick={() => playAndQueue(props.uri)}
										disabled={!isSpotifyUri}
									>
										<svg
											role="img"
											height="24"
											width="24"
											aria-hidden="true"
											className="Svg-img-24 Svg-img-24-icon main-trackList-rowPlayPauseIcon"
											viewBox="0 0 24 24"
											data-encore-id="icon"
										>
											<path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z" />
										</svg>
									</button>
								</Spicetify.ReactComponent.TooltipWrapper>
							</div>
						</div>
						<div className="main-trackList-rowSectionStart" role="gridcell" aria-colindex={2} tabIndex={-1}>
							<TrackArtwork image={props.image} name={props.name} />
							<div className="main-trackList-rowMainContent">
								<div
									dir="auto"
									className="TypeElement-ballad-textBase TypeElement-ballad-textBase-type main-trackList-rowTitle standalone-ellipsis-one-line encore-text-body-medium encore-internal-color-text-base"
									data-encore-id="type"
									style={{ gridArea: "title", justifySelf: "start" }}
								>
									{props.name}
								</div>
								{explicit &&
									<span
										className="TypeElement-mesto-textSubdued TypeElement-mesto-textSubdued-type main-trackList-rowSubTitle standalone-ellipsis-one-line encore-text-body-medium encore-internal-color-text-subdued"
										data-encore-id="text"
										style={{ gridArea: "badges", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
									>
										<ExplicitBadge />
									</span>
								}
								<span
									className="TypeElement-mesto-textSubdued TypeElement-mesto-textSubdued-type main-trackList-rowSubTitle standalone-ellipsis-one-line encore-text-body-small encore-internal-color-text-subdued"
									data-encore-id="type"
									style={{ gridColumnStart: "subtitle", gridArea: "subtitle" }}
								>
									<div className="encore-text-body-small" data-encore-id="text" >
										{ArtistLinks}
									</div>
								</span>
							</div>
						</div>
						{props.playcount && (
							<div className="main-trackList-rowSectionVariable" role="gridcell" aria-colindex={3} tabIndex={-1}>
								<span data-encore-id="type" className="TypeElement-mesto TypeElement-mesto-type">
									{formatNumber(props.playcount)}
								</span>
							</div>
						)}
						<div className="main-trackList-rowSectionVariable" role="gridcell" aria-colindex={4} tabIndex={-1}>
							<span data-encore-id="type" className="TypeElement-mesto TypeElement-mesto-type">
								{albumUri ? (
									<a
										draggable="true"
										className="standalone-ellipsis-one-line"
										dir="auto"
										href={albumUri}
										tabIndex={-1}
									>
										{albumName}
									</a>
								) : (
									<span
										className="standalone-ellipsis-one-line"
										dir="auto"
									>
										{albumName}
									</span>
								)}
							</span>
						</div>
						<div className="main-trackList-rowSectionEnd" role="gridcell" aria-colindex={5} tabIndex={-1}>
							{isSpotifyUri && <LikedIcon active={liked} uri={props.uri} />}
							<div
								className="TypeElement-mesto-textSubdued TypeElement-mesto-textSubdued-type main-trackList-rowDuration"
								data-encore-id="type"
							>
								{Spicetify.Player.formatTime(props.duration_ms)}
							</div>

							<button
								type="button"
								aria-haspopup="menu"
								aria-label={`More options for ${props.name}`}
								className="main-moreButton-button Button-sm-16-buttonTertiary-iconOnly-condensed-useBrowserDefaultFocusStyle Button-small-small-buttonTertiary-iconOnly-condensed-useBrowserDefaultFocusStyle main-trackList-rowMoreButton"
								tabIndex={-1}
								onClick={handleMoreClick}
							>
								<Spicetify.ReactComponent.TooltipWrapper
									label={`More options for ${props.name} by ${props.artists.map((artist) => artist.name).join(", ")}`}
									placement="top"
								>
									<span>
										<svg
											role="img"
											height="16"
											width="16"
											aria-hidden="true"
											viewBox="0 0 16 16"
											data-encore-id="icon"
											className="Svg-img-16 Svg-img-16-icon Svg-img-icon Svg-img-icon-small"
										>
											<path d="M3 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm6.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM16 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
										</svg>
									</span>
								</Spicetify.ReactComponent.TooltipWrapper>
							</button>
						</div>
					</DraggableComponent>
			{menuPos && <TrackContextMenu x={menuPos.x} y={menuPos.y} items={menuItems} onClose={closeMenu} />}
		</div>
	);
};

export default React.memo(TrackRow);