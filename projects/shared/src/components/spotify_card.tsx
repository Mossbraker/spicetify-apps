import React from "react";

interface SpotifyCardProps {
	type: "artist" | "album" | "lastfm" | "playlist";
	uri: string;
	header: string;
	subheader: string;
	imageUrl?: string;
	artistUri?: string;
	badge?: string | React.ReactElement;
	provider?: "spotify" | "lastfm";
}

function SpotifyCard(props: SpotifyCardProps): React.ReactElement<HTMLDivElement> {
	const { type, header, uri, imageUrl, subheader, artistUri, badge, provider = "spotify" } = props;
	const [imageFailed, setImageFailed] = React.useState(false);
	const fallbackLabel = header
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "?";

	const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
		if (provider === "lastfm") {
			return;
		}

		event.preventDefault();
		Spicetify.Platform.History.push(uri);
	};

	const cardHref = provider === "lastfm" ? uri : "#";
	const imageClassName = type === "artist" ? "stats-plain-card-image is-circular" : "stats-plain-card-image";

	return (
		<div className="stats-plain-card-wrapper">
			<a className="stats-plain-card" href={cardHref} onClick={handleClick} target={provider === "lastfm" ? "_blank" : undefined} rel={provider === "lastfm" ? "noreferrer" : undefined}>
				<div className={imageClassName}>
					{imageUrl && !imageFailed ? (
						<img src={imageUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} />
					) : (
						<div className="stats-plain-card-imageFallback" aria-hidden="true">
							<span className="stats-plain-card-imageFallbackLabel">{fallbackLabel}</span>
						</div>
					)}
				</div>
				<div className="stats-plain-card-copy">
					<div className="stats-plain-card-title">{header}</div>
					<div className="stats-plain-card-subtitle">{subheader}</div>
					{artistUri && provider === "spotify" && type === "album" ? <span className="stats-plain-card-meta">{artistUri}</span> : null}
				</div>
			</a>
				{badge && <div className="badge">{badge}</div>}
		</div>
	);
}

export default SpotifyCard;
