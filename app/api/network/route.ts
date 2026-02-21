import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { stdout } = await execAsync("ss -tlnp 2>/dev/null | grep 18789 || true");
        const lines = stdout.trim();
        const listening = lines.length > 0 && lines.includes("18789");

        let connectionCount = 0;
        if (listening) {
            try {
                const { stdout: connOut } = await execAsync(
                    "ss -tnp 2>/dev/null | grep 18789 | wc -l"
                );
                connectionCount = parseInt(connOut.trim(), 10) || 0;
            } catch { }
        }

        return NextResponse.json({
            listening,
            port: 18789,
            protocol: "WebSocket",
            connections: connectionCount,
            details: lines || null,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
            listening: false,
            port: 18789,
            error: message,
        });
    }
}
