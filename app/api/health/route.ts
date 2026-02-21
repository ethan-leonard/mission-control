import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { stdout } = await execAsync("systemctl --user is-active openclaw-gateway.service");
        const status = stdout.trim();

        let uptime = "";
        try {
            const { stdout: uptimeOut } = await execAsync(
                "systemctl --user show openclaw-gateway.service --property=ActiveEnterTimestamp --value"
            );
            uptime = uptimeOut.trim();
        } catch { }

        return NextResponse.json({
            status: status === "active" ? "active" : "inactive",
            raw: status,
            uptime,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({
            status: "inactive",
            raw: "error",
            error: message,
        });
    }
}
