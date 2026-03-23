import React from "react";
import { debugLog } from "../extensions/debug";

export const usePopupQuery = <T,>(callback: () => Promise<T>, initialData?: T) => {
	const [error, setError] = React.useState<null | Error>(null);
	const [data, setData] = React.useState<null | T>(initialData ?? null);
	const [status, setStatus] = React.useState<"pending" | "error" | "success">(
		initialData !== undefined ? "success" : "pending",
	);

	React.useEffect(() => {
		// Skip the fetch entirely if we were given fresh cached data up front.
		if (initialData !== undefined) return;

		let cancelled = false;
		setStatus("pending");
		setError(null);
		setData(null);
		const fetchData = async () => {
			try {
				const result = await callback();
				if (cancelled) return;
				setData(result);
				setStatus("success");
			} catch (e) {
				debugLog(e);
				if (cancelled) return;
				setError(e as Error);
				setStatus("error");
			}
		};
		fetchData();
		return () => {
			cancelled = true;
		};
	}, [callback]); // eslint-disable-line react-hooks/exhaustive-deps -- initialData is a one-time mount hint; including it would cause spurious re-runs when the cached reference changes without semantic change. When callback changes, the effect re-runs and captures the current initialData naturally.

	return { status, error, data };
};
