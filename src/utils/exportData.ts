import type { FireSnapshot } from "../features/types";

type Primitive = string | number | boolean | null | undefined;

type ExportTable = {
  title: string;
  headers: string[];
  rows: Primitive[][];
};

function text(value: Primitive) {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = String(value);
  if (typeof value === "string" && /^[\t\r ]*[=+\-@]/.test(raw)) {
    return `'${raw}`;
  }
  return raw;
}

function csvCell(value: Primitive) {
  const raw = text(value);
  if (!/[",\n\r]/.test(raw)) {
    return raw;
  }

  return `"${raw.replace(/"/g, '""')}"`;
}

function tsvCell(value: Primitive) {
  return text(value).replace(/\t/g, " ").replace(/\r?\n/g, " ");
}

function tableToDelimited(table: ExportTable, delimiter: "," | "\t") {
  const cell = delimiter === "," ? csvCell : tsvCell;
  return [
    table.title,
    table.headers.map(cell).join(delimiter),
    ...table.rows.map((row) => row.map(cell).join(delimiter)),
  ].join("\n");
}

function buildTables(snapshot: FireSnapshot): ExportTable[] {
  const categories = new Map(snapshot.categories.map((category) => [category.id, category]));

  return [
    {
      title: "Transactions",
      headers: [
        "id",
        "type",
        "date",
        "amount",
        "currency",
        "category",
        "note",
        "archivedAt",
        "createdAt",
        "updatedAt",
      ],
      rows: snapshot.transactions.map((transaction) => [
        transaction.id,
        transaction.type,
        transaction.date,
        transaction.amount,
        transaction.currency,
        categories.get(transaction.categoryId)?.name ?? transaction.categoryId,
        transaction.note,
        transaction.archivedAt,
        transaction.createdAt,
        transaction.updatedAt,
      ]),
    },
    {
      title: "Assets",
      headers: [
        "id",
        "name",
        "assetClass",
        "ticker",
        "quantity",
        "manualValue",
        "currency",
        "expectedAnnualReturn",
        "includeInFire",
        "updateMethod",
        "notes",
        "archivedAt",
      ],
      rows: snapshot.assets.map((asset) => [
        asset.id,
        asset.name,
        asset.assetClass,
        asset.googleFinanceSymbol ?? asset.ticker,
        asset.quantity,
        asset.manualValue,
        asset.currency,
        asset.expectedAnnualReturn,
        asset.includeInFire,
        asset.updateMethod,
        asset.notes,
        asset.archivedAt,
      ]),
    },
    {
      title: "FIRE Goals",
      headers: [
        "id",
        "name",
        "currentAge",
        "baseCurrency",
        "targetMonthlySpending",
        "monthlySaving",
        "withdrawalRate",
        "inflationRate",
        "targetAmount",
        "isMain",
      ],
      rows: snapshot.goals.map((goal) => [
        goal.id,
        goal.name,
        goal.currentAge,
        goal.baseCurrency,
        goal.targetMonthlySpending,
        goal.monthlySaving,
        goal.withdrawalRate,
        goal.inflationRate,
        goal.targetAmount,
        goal.isMain,
      ]),
    },
    {
      title: "FIRE Methods",
      headers: [
        "id",
        "name",
        "isDefault",
        "targetSpendingAdjustment",
        "monthlySavingAdjustment",
        "withdrawalRateAdjustment",
        "inflationAdjustment",
        "expectedReturnAdjustment",
        "archivedAt",
      ],
      rows: snapshot.scenarios.map((scenario) => [
        scenario.id,
        scenario.name,
        scenario.isDefault,
        scenario.targetSpendingAdjustment,
        scenario.monthlySavingAdjustment,
        scenario.withdrawalRateAdjustment,
        scenario.inflationAdjustment,
        scenario.expectedReturnAdjustment,
        scenario.archivedAt,
      ]),
    },
    {
      title: "Milestones",
      headers: [
        "id",
        "goalId",
        "name",
        "targetAmount",
        "targetDate",
        "expectedReturnOverride",
        "isActive",
        "isHidden",
        "order",
        "archivedAt",
      ],
      rows: snapshot.milestones.map((milestone) => [
        milestone.id,
        milestone.goalId,
        milestone.name,
        milestone.targetAmount,
        milestone.targetDate,
        milestone.expectedReturnOverride,
        milestone.isActive,
        milestone.isHidden,
        milestone.order,
        milestone.archivedAt,
      ]),
    },
    {
      title: "Quote Cache",
      headers: [
        "assetId",
        "symbol",
        "price",
        "currency",
        "convertedPrice",
        "convertedCurrency",
        "fxRate",
        "status",
        "asOf",
        "receivedAt",
      ],
      rows: snapshot.quoteCache.map((quote) => [
        quote.assetId,
        quote.symbol,
        quote.price,
        quote.currency,
        quote.convertedPrice,
        quote.convertedCurrency,
        quote.fxRate,
        quote.status,
        quote.asOf,
        quote.receivedAt,
      ]),
    },
  ];
}

export function buildCsvExport(snapshot: FireSnapshot) {
  return buildTables(snapshot)
    .map((table) => tableToDelimited(table, ","))
    .join("\n\n");
}

export function buildGoogleSheetsExport(snapshot: FireSnapshot) {
  return buildTables(snapshot)
    .map((table) => tableToDelimited(table, "\t"))
    .join("\n\n");
}
