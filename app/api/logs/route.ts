import { NextResponse } from "next/server";
import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";

const LOG_PATH = "/home/rootb/a17-studio/production/daemon_log.txt";

export async function GET() {
    try {
        const content = await readFile(LOG_PATH, "utf-8");
        const allLines = content.split("\n").filter((l) => l.trim().length > 0);
        const lines = allLines.slice(-15);

        return NextResponse.json({
            lines,
            totalLines: allLines.length,
            path: LOG_PATH,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
            lines: [],
            totalLines: 0,
            error: message,
            path: LOG_PATH,
        });
    }
}
