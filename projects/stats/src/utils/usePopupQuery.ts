import React from "react";
import { debugLog } from "../extensions/debug";

export const usePopupQuery = <T,>(callback: () => Promise<T>) => {
	const [error, setError] = React.useState<null | Error>(null);
	const [data, setData] = React.useState<null | T>(null);
	const [status, setStatus] = React.useState<"pending" | "error" | "success">("pending");

	React.useEffect(() => {
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
	}, [callback]);

	return { status, error, data };
};
