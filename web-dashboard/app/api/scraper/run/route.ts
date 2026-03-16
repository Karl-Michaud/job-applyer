import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { NextResponse } from "next/server";

const execAsync = promisify(exec);
const SCRAPER_DIR = path.join(process.cwd(), "..", "scraper");

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync("python3 main.py", {
      cwd: SCRAPER_DIR,
      timeout: 5 * 60 * 1000, // 5 minutes
      maxBuffer: 10 * 1024 * 1024,
    });
    return NextResponse.json({ ok: true, stdout, stderr });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json(
      { ok: false, stdout: e.stdout, stderr: e.stderr, error: e.message },
      { status: 500 }
    );
  }
}
