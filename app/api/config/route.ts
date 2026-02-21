import { NextResponse } from "next/server";
import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";

const CONFIG_PATH = "/home/rootb/.openclaw/openclaw.json";

export async function GET() {
    try {
        const content = await readFile(CONFIG_PATH, "utf-8");
        const config = JSON.parse(content);

        const models = {
            primary: config?.agents?.defaults?.model?.primary || "unknown",
        };

        const channels: Record<string, { enabled: boolean; mode?: string }> = {};
        if (config?.channels) {
            for (const [name, ch] of Object.entries(config.channels)) {
                const channel = ch as Record<string, unknown>;
                channels[name] = {
                    enabled: !!channel.enabled,
                    mode: (channel.streamMode as string) || undefined,
                };
            }
        }

        const gateway = {
            port: config?.gateway?.port || null,
            mode: config?.gateway?.mode || null,
            bind: config?.gateway?.bind || null,
        };

        const plugins: Record<string, boolean> = {};
        if (config?.plugins?.entries) {
            for (const [name, p] of Object.entries(config.plugins.entries)) {
                const plugin = p as Record<string, unknown>;
                plugins[name] = !!plugin.enabled;
            }
        }

        const meta = config?.meta || {};

        return NextResponse.json({
            models,
            channels,
            gateway,
            plugins,
            meta,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
            error: message,
        });
    }
}
