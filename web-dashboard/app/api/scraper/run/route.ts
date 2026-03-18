import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const execAsync = promisify(exec);
const SCRAPER_DIR = path.join(process.cwd(), "..", "scraper");

const ALL_SCRAPERS = ["greenhouse", "lever", "ashby", "simplify"];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const scrapers: string[] = body.scrapers ?? ALL_SCRAPERS;
  const applyFilters: boolean = body.applyFilters ?? true;
  const remotePreference: string = body.remotePreference ?? "any";

  const args = ["--scrapers", ...scrapers];
  if (!applyFilters) args.push("--no-filter");
  if (remotePreference !== "any") args.push("--remote-preference", remotePreference);

  const cmd = `python3 main.py ${args.join(" ")}`;

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: SCRAPER_DIR,
      timeout: 5 * 60 * 1000,
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
