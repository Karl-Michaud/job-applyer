"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { Application, ApplicationStage } from "@/features/applied/models/types";

interface ApplicationSankeyProps {
  applications: Application[];
}

// Stages that represent "in interview loop" — merged into one node
const INTERVIEW_STAGES = new Set<ApplicationStage>(["interviewing", "onsite"]);

// Human-readable label for each stage (onsite collapses into Interviewing)
const STAGE_LABEL: Record<ApplicationStage, string> = {
  applied:      "Applied",
  oa:           "OA",
  phone_screen: "Phone Screen",
  interviewing: "Interviewing",
  onsite:       "Interviewing",
  offer:        "Offer",
  rejected:     "Rejected",
  ghosted:      "Ghosted",
  withdrawn:    "Withdrawn",
};

// Forward-only stage order used for fallback inference
const STAGE_ORDER: ApplicationStage[] = [
  "applied", "oa", "phone_screen", "interviewing", "onsite", "offer",
];

function getPath(app: Application): string[] {
  const history = app.stage_history ?? [];

  if (history.length > 0) {
    // Build path from recorded history, skipping any label already seen to prevent cycles
    const seen = new Set<string>(["Applied"]);
    const stages: string[] = ["Applied"];
    for (const entry of history) {
      const label = STAGE_LABEL[entry.stage];
      if (label && !seen.has(label)) {
        seen.add(label);
        stages.push(label);
      }
    }
    return stages;
  }

  // Fallback: infer path from current stage only
  const idx = STAGE_ORDER.indexOf(app.stage);
  if (idx > 0) {
    // Progressive stage — assume they went through the standard order up to here
    const seen = new Set<string>();
    const path: string[] = [];
    for (const s of STAGE_ORDER.slice(0, idx + 1)) {
      const label = STAGE_LABEL[s];
      if (!seen.has(label)) { seen.add(label); path.push(label); }
    }
    return path;
  }

  // Still at initial applied stage — no movement yet
  if (app.stage === "applied") {
    return ["Applied", "In Progress"];
  }

  // Terminal stage without history (rejected, ghosted, etc.)
  return ["Applied", STAGE_LABEL[app.stage] ?? app.stage];
}

function buildSankeyData(applications: Application[]) {
  const linkCounts = new Map<string, number>();

  for (const app of applications) {
    const path = getPath(app);
    for (let i = 0; i < path.length - 1; i++) {
      const src = path[i];
      const tgt = path[i + 1];
      if (src !== tgt) {
        const key = `${src}|||${tgt}`;
        linkCounts.set(key, (linkCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const links = Array.from(linkCounts.entries()).map(([key, value]) => {
    const [source, target] = key.split("|||");
    return { source, target, value };
  });

  const nodeIds = new Set(links.flatMap((l) => [l.source, l.target]));
  const nodes = Array.from(nodeIds).map((id) => ({ id }));

  return { nodes, links };
}

export function ApplicationSankey({ applications }: ApplicationSankeyProps) {
  if (applications.length === 0) return null;

  const data = buildSankeyData(applications);

  if (data.links.length === 0) {
    return (
      <div
        className="mx-auto flex items-center justify-center rounded-md border border-zinc-200 bg-white text-sm text-zinc-400"
        style={{ width: 720, height: 300 }}
      >
        Move applications through stages to see the pipeline.
      </div>
    );
  }

  return (
    <div
      className="mx-auto rounded-md border border-zinc-200 bg-white p-4"
      style={{ width: 720, height: 300 }}
    >
      <ResponsiveSankey
        data={data}
        margin={{ top: 12, right: 148, bottom: 12, left: 140 }}
        align="justify"
        colors={{ scheme: "category10" }}
        nodeOpacity={1}
        nodeThickness={16}
        nodeInnerPadding={3}
        nodeSpacing={20}
        nodeBorderWidth={0}
        linkOpacity={0.25}
        linkHoverOthersOpacity={0.08}
        enableLinkGradient
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={12}
        label={(node) => `${node.id} · ${node.value}`}
        theme={{
          text: { fontSize: 11, fill: "#71717a" },
          tooltip: {
            container: {
              background: "#18181b",
              color: "#f4f4f5",
              fontSize: 12,
              borderRadius: 6,
            },
          },
        }}
      />
    </div>
  );
}
