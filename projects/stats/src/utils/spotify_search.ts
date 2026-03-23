import { searchForTrack, searchForArtist } from "../api/spotify";

export async function searchAndNavigate(
	type: "artist" | "track",
	name: string,
	fallbackUrl: string,
	artistName?: string,
): Promise<void> {
	try {
		let uri: string | undefined;

		if (type === "track") {
			const items = await searchForTrack(name, artistName ?? "");
			uri = items?.[0]?.uri;
		} else {
			const items = await searchForArtist(name);
			uri = items?.[0]?.uri;
		}

		if (uri) {
			const id = uri.split(":")[2];
			Spicetify.Platform.History.push(`/${type}/${id}`);
		} else {
			window.open(fallbackUrl, "_blank", "noreferrer");
		}
	} catch {
		window.open(fallbackUrl, "_blank", "noreferrer");
	}
}
