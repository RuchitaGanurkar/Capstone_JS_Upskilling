import * as ticketsApi from "../api/tickets.js";

function countQs(extra) {
  const p = new URLSearchParams({ _limit: "1" });
  if (extra) {
    for (const k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) p.set(k, extra[k]);
    }
  }
  return p.toString();
}

export async function fetchDashboardCounts() {
  const [totalRes, openRes, progRes, resolvedRes] = await Promise.all([
    ticketsApi.getTicketsCount(countQs()),
    ticketsApi.getTicketsCount(countQs({ status: "open" })),
    ticketsApi.getTicketsCount(countQs({ status: "in-progress" })),
    ticketsApi.getTicketsCount(countQs({ status: "resolved" })),
  ]);
  return {
    total: totalRes.totalCount,
    open: openRes.totalCount,
    inprogress: progRes.totalCount,
    resolved: resolvedRes.totalCount,
  };
}
