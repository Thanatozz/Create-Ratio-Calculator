import { Package } from "lucide-react";
import { useCalculatorStore } from "../../stores/calculatorStore";
import { formatRate } from "../../components/ui/format";
import { CreateIcon } from "../../components/icons/CreateIcon";
import { itemById } from "../../data/create-1.21.1/items";
import { useTranslation } from "../../i18n";

interface ResourceRow {
  id: string;
  type: "Target" | "Generated" | "Base Material" | "Input" | "Byproduct";
  item: string;
  rate: string;
  source: string;
  notes: string;
  itemId?: string;
}

function itemName(itemId: string): string {
  return itemById[itemId]?.name ?? itemId;
}

function typeClass(type: ResourceRow["type"]): string {
  switch (type) {
    case "Target":
      return "text-factory-brass";
    case "Generated":
      return "text-factory-green";
    case "Byproduct":
      return "text-factory-warning";
    case "Base Material":
      return "text-factory-copper";
    case "Input":
      return "text-stone-300";
  }
}

export function ResourcesTab() {
  const result = useCalculatorStore((state) => state.result);
  const t = useTranslation();
  const inputFlowKeys = new Set<string>();
  const rows: ResourceRow[] = [
    {
      id: `target:${result.target.targetItemId}`,
      type: "Target",
      item: itemName(result.target.targetItemId),
      itemId: result.target.targetItemId,
      rate: formatRate(result.target.targetRatePerMinute),
      source:
        result.machines.find((machine) => machine.role === "target")?.machineName ??
        t("resources.factoryOutput"),
      notes: result.calculationMode === "fixed_machines" ? t("resources.fixedTargetNote") : t("resources.targetNote")
    }
  ];

  for (const resource of result.rawInputs) {
    inputFlowKeys.add(resource.itemId);
    const provider = result.machines.find(
      (machine) =>
        machine.outputItemId === resource.itemId &&
        machine.role === "input_provider"
    );
    const used = provider?.requiredRatePerMinute ?? resource.ratePerMinute;
    const available = provider?.availableRatePerMinute;

    rows.push({
      id: resource.id,
      type: resource.source === "generated" ? "Generated" : "Base Material",
      item: resource.itemName,
      itemId: resource.itemId,
      rate:
        available && available > used
          ? `${formatRate(available)} available / ${formatRate(used)} used`
          : formatRate(resource.ratePerMinute),
      source: provider?.machineName ?? resource.sourceName,
      notes:
        resource.source === "generated"
          ? t("resources.generatedNote")
          : t("resources.baseMaterialNote")
    });
  }

  for (const flow of result.itemFlows.filter((flow) => flow.kind === "input")) {
    if (inputFlowKeys.has(flow.itemId)) {
      continue;
    }

    rows.push({
      id: flow.id,
      type: "Input",
      item: flow.itemName,
      itemId: flow.itemId,
      rate: formatRate(flow.ratePerMinute),
      source: t("resources.input"),
      notes: t("resources.intermediateNote")
    });
  }

  for (const byproduct of result.byproducts) {
    rows.push({
      id: byproduct.id,
      type: "Byproduct",
      item: byproduct.itemName,
      itemId: byproduct.itemId,
      rate: formatRate(byproduct.ratePerMinute),
      source: byproduct.fromRecipeId,
      notes: t("resources.byproductNote", { chance: Math.round(byproduct.chance * 100) })
    });
  }

  return (
    <div className="industrial-scrollbar min-h-0 overflow-auto p-3">
      <section className="rounded-md border border-factory-border bg-factory-panel">
        <div className="flex items-center gap-2 border-b border-factory-border px-3 py-2">
          <Package size={15} className="text-factory-brass" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-factory-brass">
            {t("resources.title")}
          </h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-factory-panel2 text-[11px] uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2">{t("resources.type")}</th>
                <th className="px-3 py-2">{t("resources.item")}</th>
                <th className="px-3 py-2 text-right">{t("resources.rateAmount")}</th>
                <th className="px-3 py-2">{t("resources.source")}</th>
                <th className="px-3 py-2">{t("resources.notes")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-t border-factory-border/80 hover:bg-factory-panel2/60 ${
                    row.type === "Byproduct" ? "bg-factory-warning/5" : ""
                  }`}
                >
                  <td className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${typeClass(row.type)}`}>
                    {t(
                      row.type === "Target"
                        ? "resources.target"
                        : row.type === "Generated"
                          ? "resources.generated"
                          : row.type === "Input"
                            ? "resources.input"
                            : row.type === "Base Material"
                              ? "resources.baseMaterial"
                              : "resources.byproduct"
                    )}
                  </td>
                  <td className="px-3 py-2 font-semibold text-stone-100">
                    <span className="flex items-center gap-2">
                      <CreateIcon id={row.itemId} />
                      {row.item}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-stone-300">{row.rate}</td>
                  <td className="px-3 py-2 text-stone-300">{row.source}</td>
                  <td className="px-3 py-2 text-stone-500">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
