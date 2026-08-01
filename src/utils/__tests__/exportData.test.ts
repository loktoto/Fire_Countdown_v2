import { buildCsvExport, buildGoogleSheetsExport } from "../exportData";
import { seedSnapshot } from "../../data/seed";

describe("exportData", () => {
  it("builds a CSV export with key FIRE tables", () => {
    const csv = buildCsvExport(seedSnapshot);

    expect(csv).toContain("Transactions");
    expect(csv).toContain("Assets");
    expect(csv).toContain("FIRE Goals");
    expect(csv).toContain("FIRE Methods");
    expect(csv).toContain("Milestones");
    expect(csv).toContain("Quote Cache");
    expect(csv).toContain("txn-1,expense,2026-06-29,120,HKD,Food,Lunch");
  });

  it("builds a Google Sheets paste format using tabs", () => {
    const sheetText = buildGoogleSheetsExport(seedSnapshot);

    expect(sheetText).toContain("id\ttype\tdate\tamount\tcurrency");
    expect(sheetText).toContain("txn-1\texpense\t2026-06-29\t120\tHKD\tFood\tLunch");
  });

  it("neutralizes user-entered spreadsheet formulas without changing numeric cells", () => {
    const snapshot = {
      ...seedSnapshot,
      transactions: [
        {
          ...seedSnapshot.transactions[0]!,
          note: '=HYPERLINK("https://example.com")',
          amount: -25,
        },
      ],
      assets: [{ ...seedSnapshot.assets[0]!, name: " @SUM(A1:A2)" }],
    };

    expect(buildCsvExport(snapshot)).toContain("'=HYPERLINK");
    expect(buildGoogleSheetsExport(snapshot)).toContain("' @SUM(A1:A2)");
    expect(buildCsvExport(snapshot)).toContain(",-25,");
  });
});
