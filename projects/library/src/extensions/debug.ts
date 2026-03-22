export type LibraryDebugLevel = "info" | "warn" | "error";

export interface LibraryDebugLogEntry {
	id: number;
	level: LibraryDebugLevel;
	message: string;
	timestamp: number;
	meta?: unknown;
}

interface LibraryDebugSnapshot {
	logs: LibraryDebugLogEntry[];
}

const MAX_DEBUG_LOGS = 150;
const logs: LibraryDebugLogEntry[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

const emit = () => {
	listeners.forEach((listener) => listener());
};

const attachGlobals = () => {
	if (typeof window === "undefined") return;
	(window as Window & { __libraryDebug?: typeof libraryDebug }).__libraryDebug = libraryDebug;
	if ((window as Window & { SpicetifyLibrary?: { debug?: typeof libraryDebug } }).SpicetifyLibrary) {
		(window as Window & { SpicetifyLibrary?: { debug?: typeof libraryDebug } }).SpicetifyLibrary!.debug = libraryDebug;
	}
};

const addLog = (level: LibraryDebugLevel, message: string, meta?: unknown) => {
	logs.push({
		id: nextId++,
		level,
		message,
		timestamp: Date.now(),
		meta,
	});
	if (logs.length > MAX_DEBUG_LOGS) logs.splice(0, logs.length - MAX_DEBUG_LOGS);
	attachGlobals();
	emit();
};

export const libraryDebug = {
	log(level: LibraryDebugLevel, message: string, meta?: unknown) {
		addLog(level, message, meta);
	},
	info(message: string, meta?: unknown) {
		addLog("info", message, meta);
	},
	warn(message: string, meta?: unknown) {
		addLog("warn", message, meta);
	},
	error(message: string, meta?: unknown) {
		addLog("error", message, meta);
	},
	clearLogs() {
		logs.length = 0;
		emit();
	},
	getSnapshot(): LibraryDebugSnapshot {
		return { logs: [...logs] };
	},
	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
};

attachGlobals();
