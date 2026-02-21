import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { stdout } = await execAsync(
            "journalctl --user -u openclaw-gateway.service --no-pager -n 15 --output=short-iso 2>/dev/null"
        );
        const allLines = stdout.split("\n").filter((l) => l.trim().length > 0);
        const lines = allLines.slice(-15);

        return NextResponse.json({
            lines,
            totalLines: lines.length,
            source: "journalctl",
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
            lines: [],
            totalLines: 0,
            error: message,
            source: "journalctl",
        });
    }
}
