import { HttpClient } from "./client";
import type { BaseEvent, CustomEventSpan, ErrorSpan, EventContext, TrackerOptions, WebVitalEvent } from "./types";
import { generateUUIDv4, logger } from "./utils";

const HEADLESS_CHROME_REGEX = /\bHeadlessChrome\b/i;
const PHANTOMJS_REGEX = /\bPhantomJS\b/i;

export class BaseTracker {
	options: TrackerOptions;
	api: HttpClient;

	// State
	anonymousId?: string;
	sessionId?: string;
	sessionStartTime = 0;
	lastActivityTime: number = Date.now();

	// Engagement
	pageCount = 0;
	lastPath = "";
	isInternalNavigation = false;
	interactionCount = 0;
	maxScrollDepth = 0;
	pageStartTime: number = Date.now();
	pageEngagementStart: number = Date.now();

	// Bot Detection
	isLikelyBot = false;
	hasInteracted = false;

	// Queues
	batchQueue: BaseEvent[] = [];
	batchTimer: Timer | null = null;
	private isFlushing = false;

	// Vitals Queue
	vitalsQueue: WebVitalEvent[] = [];
	vitalsTimer: Timer | null = null;
	private isFlushingVitals = false;

	// Errors Queue
	errorsQueue: ErrorSpan[] = [];
	errorsTimer: Timer | null = null;
	private isFlushingErrors = false;

	// Custom Events Queue
	customEventsQueue: CustomEventSpan[] = [];
	customEventsTimer: Timer | null = null;
	private isFlushingCustomEvents = false;

	private readonly routeChangeCallbacks: Array<(path: string) => void> = [];

	constructor(options: TrackerOptions) {
		if (!options.clientId || typeof options.clientId !== "string") {
			throw new Error("[Databuddy] clientId is required and must be a string");
		}

		this.options = {
			disabled: false,
			trackPerformance: true,
			samplingRate: 1.0,
			enableRetries: false,
			maxRetries: 3,
			initialRetryDelay: 500,
			enableBatching: true,
			batchSize: 10,
			batchTimeout: 5000,
			sdk: "web",
			sdkVersion: "2.0.0",
			...options,
		};

		const headers: Record<string, string> = {
			"databuddy-client-id": this.options.clientId,
		};
		headers["databuddy-sdk-name"] = this.options.sdk || "web";
		headers["databuddy-sdk-version"] = this.options.sdkVersion || "2.0.0";

		this.api = new HttpClient({
			baseUrl: this.options.apiUrl || "https://basket.databuddy.cc",
			defaultHeaders: headers,
			maxRetries: this.options.maxRetries,
			initialRetryDelay: this.options.initialRetryDelay,
		});

		if (this.isServer()) {
			return;
		}

		this.isLikelyBot = this.detectBot();
		if (this.isLikelyBot) {
			logger.log("Bot detected, tracking might be filtered");
		}

		this.anonymousId = this.getOrCreateAnonymousId();
		this.sessionId = this.getOrCreateSessionId();
		this.sessionStartTime = this.getSessionStartTime();

		this.setupBotDetection();
		logger.log("Tracker initialized", this.options);
	}

	isServer(): boolean {
		return (
			typeof document === "undefined" ||
			typeof window === "undefined" ||
			typeof localStorage === "undefined"
		);
	}

	detectBot(): boolean {
		if (this.isServer()) {
			return false;
		}
		if (this.options.ignoreBotDetection) {
			return false;
		}
		const ua = navigator.userAgent || "";
		const isHeadless =
			HEADLESS_CHROME_REGEX.test(ua) || PHANTOMJS_REGEX.test(ua);

		const isBot = Boolean(
			navigator.webdriver ||
			window.webdriver ||
			isHeadless ||
			window.callPhantom ||
			window._phantom ||
			window.selenium ||
			document.documentElement.getAttribute("webdriver") === "true"
		);
		return isBot;
	}

	setupBotDetection() {
		if (this.isServer()) {
			return;
		}
		const events = ["mousemove", "scroll", "keydown"];
		const handler = () => {
			this.hasInteracted = true;
		};
		for (const event of events) {
			window.addEventListener(event, handler, { once: true, passive: true });
		}
	}

	getOrCreateAnonymousId(): string {
		if (this.isServer()) {
			return this.generateAnonymousId();
		}

		const urlParams = new URLSearchParams(window.location.search);
		const anonId = urlParams.get("anonId");
		if (anonId) {
			localStorage.setItem("did", anonId);
			return anonId;
		}

		const storedId = localStorage.getItem("did");
		if (storedId) {
			return storedId;
		}

		const newId = this.generateAnonymousId();
		localStorage.setItem("did", newId);
		return newId;
	}

	generateAnonymousId(): string {
		return `anon_${generateUUIDv4()}`;
	}

	getOrCreateSessionId(): string {
		if (this.isServer()) {
			return this.generateSessionId();
		}

		const urlParams = new URLSearchParams(window.location.search);
		const sessionIdFromUrl = urlParams.get("sessionId");

		if (sessionIdFromUrl) {
			sessionStorage.setItem("did_session", sessionIdFromUrl);
			sessionStorage.setItem("did_session_timestamp", Date.now().toString());
			return sessionIdFromUrl;
		}

		const storedId = sessionStorage.getItem("did_session");
		const sessionTimestamp = sessionStorage.getItem("did_session_timestamp");

		if (storedId && sessionTimestamp) {
			const sessionAge = Date.now() - Number.parseInt(sessionTimestamp, 10);
			const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 mins

			if (sessionAge < SESSION_TIMEOUT) {
				sessionStorage.setItem("did_session_timestamp", Date.now().toString());
				return storedId;
			}
			// Session expired
			sessionStorage.removeItem("did_session");
			sessionStorage.removeItem("did_session_timestamp");
			sessionStorage.removeItem("did_session_start");
		}

		const newId = this.generateSessionId();
		sessionStorage.setItem("did_session", newId);
		sessionStorage.setItem("did_session_timestamp", Date.now().toString());
		return newId;
	}

	generateSessionId(): string {
		return `sess_${generateUUIDv4()}`;
	}

	getSessionStartTime(): number {
		if (this.isServer()) {
			return Date.now();
		}
		const storedTime = sessionStorage.getItem("did_session_start");
		if (storedTime) {
			return Number.parseInt(storedTime, 10);
		}

		const now = Date.now();
		sessionStorage.setItem("did_session_start", now.toString());
		return now;
	}

	protected shouldSkipTracking(): boolean {
		if (this.isServer()) {
			return true;
		}
		if (this.options.disabled) {
			logger.log("Tracking disabled");
			return true;
		}
		if (this.isLikelyBot) {
			logger.log("Tracking skipped: Bot detected");
			return true;
		}

		if (this.options.skipPatterns) {
			const pathname = window.location.pathname;
			for (const pattern of this.options.skipPatterns) {
				if (pattern === pathname) {
					logger.log("Tracking skipped: path matches skipPattern", pattern);
					return true;
				}
				const starIndex = pattern.indexOf("*");
				if (starIndex !== -1) {
					const prefix = pattern.substring(0, starIndex);
					if (pathname.startsWith(prefix)) {
						logger.log("Tracking skipped: path matches skipPattern", pattern);
						return true;
					}
				}
			}
		}

		return false;
	}

	protected getMaskedPath(): string {
		if (this.isServer()) {
			return "";
		}
		const pathname = window.location.pathname;
		if (!this.options.maskPatterns) {
			return pathname;
		}

		for (const pattern of this.options.maskPatterns) {
			const starIndex = pattern.indexOf("*");
			if (starIndex === -1) {
				continue;
			}

			const prefix = pattern.substring(0, starIndex);
			if (pathname.startsWith(prefix)) {
				if (pattern.substring(starIndex, starIndex + 2) === "**") {
					return `${prefix}*`;
				}
				const remainder = pathname.substring(prefix.length);
				const nextSlash = remainder.indexOf("/");
				const afterStar =
					nextSlash === -1 ? "" : remainder.substring(nextSlash);
				return `${prefix}*${afterStar}`;
			}
		}
		return pathname;
	}

	protected getUtmParams() {
		if (this.isServer()) {
			return {};
		}
		const urlParams = new URLSearchParams(window.location.search);
		return {
			utm_source: urlParams.get("utm_source") || undefined,
			utm_medium: urlParams.get("utm_medium") || undefined,
			utm_campaign: urlParams.get("utm_campaign") || undefined,
			utm_term: urlParams.get("utm_term") || undefined,
			utm_content: urlParams.get("utm_content") || undefined,
		};
	}

	getBaseContext(): EventContext {
		if (this.isServer()) {
			return {} as EventContext;
		}

		const utmParams = this.getUtmParams();

		let width: number | undefined = window.innerWidth;
		let height: number | undefined = window.innerHeight;
		if (width < 240 || width > 10_000 || height < 240 || height > 10_000) {
			width = undefined;
			height = undefined;
		}
		const viewport_size = width && height ? `${width}x${height}` : undefined;

		const maskedPathname = this.getMaskedPath();
		const path =
			window.location.origin +
			maskedPathname +
			window.location.search +
			window.location.hash;

		let timezone: string | undefined;
		try {
			timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		} catch { }

		return {
			path,
			title: document.title,
			referrer: document.referrer || "direct",
			viewport_size,
			timezone,
			language: navigator.language,
			...utmParams,
		};
	}

	send(event: BaseEvent & { isForceSend?: boolean }): Promise<unknown> {
		if (this.shouldSkipTracking()) {
			return Promise.resolve();
		}
		if (this.options.filter && !this.options.filter(event)) {
			logger.log("Event filtered", event);
			return Promise.resolve();
		}

		const samplingRate = this.options.samplingRate ?? 1.0;
		if (samplingRate < 1.0 && Math.random() > samplingRate) {
			logger.log("Event sampled out", event);
			return Promise.resolve();
		}

		if (this.options.enableBatching && !event.isForceSend) {
			logger.log("Queueing event for batch", event);
			return this.addToBatch(event);
		}

		logger.log("Sending event", event);
		return this.api.fetch("/", event, { keepalive: true }, { client_id: this.options.clientId });
	}

	addToBatch(event: BaseEvent): Promise<void> {
		this.batchQueue.push(event);
		if (this.batchTimer === null) {
			this.batchTimer = setTimeout(
				() => this.flushBatch(),
				this.options.batchTimeout
			);
		}
		if (this.batchQueue.length >= (this.options.batchSize || 10)) {
			this.flushBatch();
		}
		return Promise.resolve();
	}

	async flushBatch() {
		if (this.batchTimer) {
			clearTimeout(this.batchTimer);
			this.batchTimer = null;
		}
		if (this.batchQueue.length === 0 || this.isFlushing) {
			return;
		}

		this.isFlushing = true;
		const batchEvents = [...this.batchQueue];
		this.batchQueue = [];

		logger.log("Flushing batch", batchEvents.length);

		try {
			const result = await this.api.fetch("/batch", batchEvents, {
				keepalive: true,
			}, { client_id: this.options.clientId });
			logger.log("Batch sent", result);
			return result;
		} catch (_error) {
			logger.error("Batch failed, retrying individually", _error);
			for (const evt of batchEvents) {
				this.send({ ...evt, isForceSend: true });
			}
			return null;
		} finally {
			this.isFlushing = false;
		}
	}

	sendVital(event: WebVitalEvent): Promise<void> {
		if (this.shouldSkipTracking()) {
			return Promise.resolve();
		}

		logger.log("Queueing vital", event);
		return this.addToVitalsQueue(event);
	}

	addToVitalsQueue(event: WebVitalEvent): Promise<void> {
		this.vitalsQueue.push(event);
		if (this.vitalsTimer === null) {
			this.vitalsTimer = setTimeout(
				() => this.flushVitals(),
				this.options.batchTimeout
			);
		}
		if (this.vitalsQueue.length >= 6) {
			this.flushVitals();
		}
		return Promise.resolve();
	}

	async flushVitals() {
		if (this.vitalsTimer) {
			clearTimeout(this.vitalsTimer);
			this.vitalsTimer = null;
		}
		if (this.vitalsQueue.length === 0 || this.isFlushingVitals) {
			return;
		}

		this.isFlushingVitals = true;
		const vitals = [...this.vitalsQueue];
		this.vitalsQueue = [];

		logger.log("Flushing vitals", vitals.length);

		try {
			const result = await this.api.fetch("/vitals", vitals, {
				keepalive: true,
			}, { client_id: this.options.clientId });
			logger.log("Vitals sent", result);
			return result;
		} catch (error) {
			logger.error("Vitals batch failed", error);
			return null;
		} finally {
			this.isFlushingVitals = false;
		}
	}

	sendError(error: ErrorSpan): Promise<void> {
		if (this.shouldSkipTracking()) {
			return Promise.resolve();
		}

		logger.log("Queueing error", error);
		return this.addToErrorsQueue(error);
	}

	addToErrorsQueue(error: ErrorSpan): Promise<void> {
		this.errorsQueue.push(error);
		if (this.errorsTimer === null) {
			this.errorsTimer = setTimeout(
				() => this.flushErrors(),
				this.options.batchTimeout
			);
		}
		if (this.errorsQueue.length >= 10) {
			this.flushErrors();
		}
		return Promise.resolve();
	}

	async flushErrors() {
		if (this.errorsTimer) {
			clearTimeout(this.errorsTimer);
			this.errorsTimer = null;
		}
		if (this.errorsQueue.length === 0 || this.isFlushingErrors) {
			return;
		}

		this.isFlushingErrors = true;
		const errors = [...this.errorsQueue];
		this.errorsQueue = [];

		logger.log("Flushing errors", errors.length);

		try {
			const result = await this.api.fetch("/errors", errors, {
				keepalive: true,
			}, { client_id: this.options.clientId });
			logger.log("Errors sent", result);
			return result;
		} catch (error) {
			logger.error("Errors batch failed", error);
			return null;
		} finally {
			this.isFlushingErrors = false;
		}
	}

	sendCustomEvent(event: CustomEventSpan): Promise<void> {
		if (this.shouldSkipTracking()) {
			return Promise.resolve();
		}

		logger.log("Queueing custom event", event);
		return this.addToCustomEventsQueue(event);
	}

	addToCustomEventsQueue(event: CustomEventSpan): Promise<void> {
		this.customEventsQueue.push(event);
		if (this.customEventsTimer === null) {
			this.customEventsTimer = setTimeout(
				() => this.flushCustomEvents(),
				this.options.batchTimeout
			);
		}
		if (this.customEventsQueue.length >= 10) {
			this.flushCustomEvents();
		}
		return Promise.resolve();
	}

	async flushCustomEvents() {
		if (this.customEventsTimer) {
			clearTimeout(this.customEventsTimer);
			this.customEventsTimer = null;
		}
		if (this.customEventsQueue.length === 0 || this.isFlushingCustomEvents) {
			return;
		}

		this.isFlushingCustomEvents = true;
		const events = [...this.customEventsQueue];
		this.customEventsQueue = [];

		logger.log("Flushing custom events", events.length);

		try {
			const result = await this.api.fetch("/events", events, {
				keepalive: true,
			}, { client_id: this.options.clientId });
			logger.log("Custom events sent", result);
			return result;
		} catch (error) {
			logger.error("Custom events batch failed", error);
			return null;
		} finally {
			this.isFlushingCustomEvents = false;
		}
	}

	sendBeacon(data: unknown, endpoint = "/vitals"): boolean {
		if (this.isServer()) {
			return false;
		}
		if (typeof navigator === "undefined" || !navigator.sendBeacon) {
			return false;
		}
		try {
			const blob = new Blob([JSON.stringify(data)], {
				type: "application/json",
			});
			const baseUrl = this.options.apiUrl || "https://basket.databuddy.cc";
			const url = `${baseUrl}${endpoint}?client_id=${encodeURIComponent(this.options.clientId)}`;
			return navigator.sendBeacon(url, blob);
		} catch {
			return false;
		}
	}

	sendBatchBeacon(events: unknown[]): boolean {
		return this.sendBeacon(events, "/batch");
	}

	/**
	 * Register a callback to be called on route changes (for plugins)
	 */
	onRouteChange(callback: (path: string) => void): () => void {
		this.routeChangeCallbacks.push(callback);
		return () => {
			const index = this.routeChangeCallbacks.indexOf(callback);
			if (index > -1) {
				this.routeChangeCallbacks.splice(index, 1);
			}
		};
	}

	/**
	 * Notify all registered plugins of a route change
	 */
	notifyRouteChange(path: string): void {
		for (const callback of this.routeChangeCallbacks) {
			try {
				callback(path);
			} catch (error) {
				logger.error("Route change callback error", error);
			}
		}
	}
}