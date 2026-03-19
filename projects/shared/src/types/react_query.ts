import React from "react";

type QueryStatus = "pending" | "success" | "error";

type QueryOptions<TData> = {
	queryKey: unknown[];
	queryFn: (context: { queryKey: unknown[] }) => Promise<TData>;
	enabled?: boolean;
};

type InfiniteQueryOptions<TPage> = {
	queryKey: unknown[];
	queryFn: (context: { pageParam: number; queryKey: unknown[] }) => Promise<TPage>;
	initialPageParam: number;
	getNextPageParam: (lastPage: TPage, allPages: TPage[]) => number | undefined;
	enabled?: boolean;
	retry?: boolean;
	structuralSharing?: boolean;
};

type QueryResult<TData> = {
	data: TData | undefined;
	status: QueryStatus;
	error: Error | null;
	refetch: () => Promise<TData | undefined>;
};

type InfiniteQueryResult<TPage> = {
	data: { pages: TPage[]; pageParams: number[] } | undefined;
	status: QueryStatus;
	error: Error | null;
	hasNextPage: boolean;
	fetchNextPage: () => Promise<void>;
	refetch: () => Promise<void>;
};

const keyToString = (queryKey: unknown[]) => JSON.stringify(queryKey);

const normalizeError = (error: unknown) => {
	if (error instanceof Error) return error;
	return new Error(typeof error === "string" ? error : "An unknown error occurred");
};

export const useQuery = <TData,>({ queryKey, queryFn, enabled = true }: QueryOptions<TData>): QueryResult<TData> => {
	const key = keyToString(queryKey);
	const [data, setData] = React.useState<TData | undefined>(undefined);
	const [status, setStatus] = React.useState<QueryStatus>(enabled ? "pending" : "success");
	const [error, setError] = React.useState<Error | null>(null);
	const requestIdRef = React.useRef(0);
	const queryFnRef = React.useRef(queryFn);
	const queryKeyRef = React.useRef(queryKey);

	React.useEffect(() => {
		queryFnRef.current = queryFn;
		queryKeyRef.current = queryKey;
	}, [queryFn, queryKey]);

	const runQuery = React.useCallback(async () => {
		if (!enabled) {
			setStatus("success");
			setError(null);
			return data;
		}

		const requestId = ++requestIdRef.current;
		setStatus((current) => (current === "success" && data !== undefined ? current : "pending"));
		setError(null);

		try {
			const result = await queryFnRef.current({ queryKey: queryKeyRef.current });
			if (requestId === requestIdRef.current) {
				setData(result);
				setStatus("success");
			}
			return result;
		} catch (caughtError) {
			const normalized = normalizeError(caughtError);
			if (requestId === requestIdRef.current) {
				setError(normalized);
				setStatus("error");
			}
			return undefined;
		}
	}, [data, enabled]);

	React.useEffect(() => {
		if (!enabled) {
			setStatus("success");
			setError(null);
			return;
		}
		void runQuery();
	}, [enabled, key, runQuery]);

	return { data, status, error, refetch: runQuery };
};

export const useInfiniteQuery = <TPage,>({
	queryKey,
	queryFn,
	initialPageParam,
	getNextPageParam,
	enabled = true,
}: InfiniteQueryOptions<TPage>): InfiniteQueryResult<TPage> => {
	const key = keyToString(queryKey);
	const [data, setData] = React.useState<{ pages: TPage[]; pageParams: number[] } | undefined>(undefined);
	const [status, setStatus] = React.useState<QueryStatus>(enabled ? "pending" : "success");
	const [error, setError] = React.useState<Error | null>(null);
	const requestIdRef = React.useRef(0);
	const queryFnRef = React.useRef(queryFn);
	const queryKeyRef = React.useRef(queryKey);

	React.useEffect(() => {
		queryFnRef.current = queryFn;
		queryKeyRef.current = queryKey;
	}, [queryFn, queryKey]);

	const loadInitial = React.useCallback(async () => {
		if (!enabled) {
			setStatus("success");
			setError(null);
			return;
		}

		const requestId = ++requestIdRef.current;
		setStatus("pending");
		setError(null);

		try {
			const firstPage = await queryFnRef.current({ pageParam: initialPageParam, queryKey: queryKeyRef.current });
			if (requestId === requestIdRef.current) {
				setData({ pages: [firstPage], pageParams: [initialPageParam] });
				setStatus("success");
			}
		} catch (caughtError) {
			const normalized = normalizeError(caughtError);
			if (requestId === requestIdRef.current) {
				setError(normalized);
				setStatus("error");
			}
		}
	}, [enabled, initialPageParam]);

	React.useEffect(() => {
		if (!enabled) {
			setStatus("success");
			setError(null);
			return;
		}
		void loadInitial();
	}, [enabled, key, loadInitial]);

	const hasNextPage = React.useMemo(() => {
		if (!data || data.pages.length === 0) return false;
		return getNextPageParam(data.pages[data.pages.length - 1], data.pages) !== undefined;
	}, [data, getNextPageParam]);

	const fetchNextPage = React.useCallback(async () => {
		if (!enabled || !data || data.pages.length === 0) return;

		const nextPageParam = getNextPageParam(data.pages[data.pages.length - 1], data.pages);
		if (nextPageParam === undefined) return;

		try {
			const nextPage = await queryFnRef.current({ pageParam: nextPageParam, queryKey: queryKeyRef.current });
			setData((current) => {
				if (!current) return { pages: [nextPage], pageParams: [nextPageParam] };
				return {
					pages: [...current.pages, nextPage],
					pageParams: [...current.pageParams, nextPageParam],
				};
			});
			setStatus("success");
			setError(null);
		} catch (caughtError) {
			setError(normalizeError(caughtError));
			setStatus("error");
		}
	}, [data, enabled, getNextPageParam]);

	const refetch = React.useCallback(async () => {
		await loadInitial();
	}, [loadInitial]);

	return { data, status, error, hasNextPage, fetchNextPage, refetch };
};

export const QueryClientProvider = ({ children }: { children: React.ReactNode }) =>
	React.createElement(React.Fragment, null, children);

export const getQueryClient = () => null;
