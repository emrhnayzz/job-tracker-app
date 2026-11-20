import { useI18n } from "../i18n";

// A Sankey diagram of the whole search: where did the sent applications go?
// Drawn by hand as SVG, because the shape is fixed: three columns.
const WIDTH = 760;
const HEIGHT = 250;
const NODE = 12;
const GAP = 18;
const PAD = 10;
const COLUMNS = [0, 290, 580];
const FILL = {
  applied: "fill-applied",
  interview: "fill-interview",
  saved: "fill-saved",
  rejected: "fill-rejected",
  offer: "fill-offer",
};

const band = (x0, top0, bottom0, x1, top1, bottom1) => {
  const mid = (x0 + x1) / 2;
  return `M${x0},${top0} C${mid},${top0} ${mid},${top1} ${x1},${top1} L${x1},${bottom1} C${mid},${bottom1} ${mid},${bottom0} ${x0},${bottom0} Z`;
};

// Stacks the nodes of one column from `start` downwards and skips empty ones.
const stack = (nodes, start, unit) => {
  let y = start;
  return nodes
    .filter((node) => node.count > 0)
    .map((node) => {
      const placed = { ...node, y, height: Math.max(node.count * unit, 2) };
      y += placed.height + GAP;
      return placed;
    });
};

const flowCounts = (applications) => {
  const sent = applications.filter((app) => app.status !== "Saved");
  const interviewed = sent.filter((app) => app.had_interview || app.status === "Interview" || app.status === "Offer");
  const others = sent.filter((app) => !interviewed.includes(app));
  return {
    sent: sent.length,
    interviewed: interviewed.length,
    waiting: others.filter((app) => app.status !== "Rejected").length,
    rejectedEarly: others.filter((app) => app.status === "Rejected").length,
    offer: interviewed.filter((app) => app.status === "Offer").length,
    rejectedLate: interviewed.filter((app) => app.status === "Rejected").length,
    ongoing: interviewed.filter((app) => app.status !== "Offer" && app.status !== "Rejected").length,
  };
};

export default function FlowChart({ applications }) {
  const { t } = useI18n();
  const counts = flowCounts(applications);
  if (counts.sent === 0) return <p className="py-10 text-center text-sm text-muted">{t("flow.empty")}</p>;

  const unit = (HEIGHT - 2 * PAD - 2 * GAP) / counts.sent;
  const source = { key: "sent", label: t("status.Applied"), count: counts.sent, color: "applied", y: PAD, height: counts.sent * unit };
  const middle = stack(
    [
      { key: "interviewed", label: t("status.Interview"), count: counts.interviewed, color: "interview" },
      { key: "waiting", label: t("flow.waiting"), count: counts.waiting, color: "saved" },
      { key: "rejectedEarly", label: t("status.Rejected"), count: counts.rejectedEarly, color: "rejected" },
    ],
    PAD,
    unit
  );
  const interviewNode = middle.find((node) => node.key === "interviewed");
  const right = interviewNode
    ? stack(
        [
          { key: "offer", label: t("status.Offer"), count: counts.offer, color: "offer" },
          { key: "ongoing", label: t("flow.ongoing"), count: counts.ongoing, color: "interview" },
          { key: "rejectedLate", label: t("status.Rejected"), count: counts.rejectedLate, color: "rejected" },
        ],
        interviewNode.y,
        unit
      )
    : [];

  // Bands leave their source node as contiguous slices, top to bottom.
  const bandsFrom = (from, x0, targets, x1) => {
    let offset = from.y;
    return targets.map((target) => {
      const slice = target.count * unit;
      const path = band(x0 + NODE, offset, offset + slice, x1, target.y, target.y + target.height);
      offset += slice;
      return <path key={`${from.key}-${target.key}`} d={path} className={`${FILL[target.color]} opacity-25`} />;
    });
  };

  const node = (item, x) => (
    <g key={item.key}>
      <rect x={x} y={item.y} width={NODE} height={item.height} rx="3" className={FILL[item.color]} />
      <text x={x + NODE + 8} y={item.y + Math.min(item.height / 2, 16) + 4} className="fill-ink stroke-surface text-[13px] font-semibold" strokeWidth="4" paintOrder="stroke">
        {item.label}
        <tspan className="fill-muted font-normal" dx="6">{item.count}</tspan>
      </text>
    </g>
  );

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full min-w-[540px]" role="img" aria-label={t("flow.title")}>
        {bandsFrom(source, COLUMNS[0], middle, COLUMNS[1])}
        {interviewNode && bandsFrom(interviewNode, COLUMNS[1], right, COLUMNS[2])}
        {node(source, COLUMNS[0])}
        {middle.map((item) => node(item, COLUMNS[1]))}
        {right.map((item) => node(item, COLUMNS[2]))}
      </svg>
    </div>
  );
}
