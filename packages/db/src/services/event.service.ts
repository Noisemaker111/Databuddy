import { EventMeta } from "../client";

export interface IClickhouseEvent {
    id: string;
    name: string;
    device_id: string;
    profile_id: string;
    project_id: string;
    session_id: string;
    path: string;
    origin: string;
    referrer: string;
    referrer_name: string;
    referrer_type: string;
    duration: number;
    properties: Record<string, string | number | boolean | undefined | null>;
    created_at: string;
    country: string;
    city: string;
    region: string;
    longitude: number | null;
    latitude: number | null;
    os: string;
    os_version: string;
    browser: string;
    browser_version: string;
    device: string;
    brand: string;
    model: string;
    imported_at: string | null;
    sdk_name: string;
    sdk_version: string;
  }