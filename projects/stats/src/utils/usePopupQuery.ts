import React from "react";
import { debugLog } from "../extensions/debug";

export const usePopupQuery = <T,>(callback: () => Promise<T>) => {
	const [error, setError] = React.useState<null | Error>(null);
	const [data, setData] = React.useState<null | T>(null);
	const [status, setStatus] = React.useState<"pending" | "error" | "success">("pending");
	const isMountedRef = React.useRef(true);

	React.useEffect(() => {
		isMountedRef.current = true;
		const fetchData = async () => {
			try {
				const result = await callback();
				if (!isMountedRef.current) return;
				setData(result);
				setStatus("success");
			} catch (e) {
				debugLog(e);
				if (!isMountedRef.current) return;
				setError(e as Error);
				setStatus("error");
			}
		};
		fetchData();
		return () => {
			isMountedRef.current = false;
		};
	}, [callback]);

	return { status, error, data };
};
