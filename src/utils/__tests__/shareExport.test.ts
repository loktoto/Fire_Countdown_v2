import { shareExportWithFallback } from "../shareExport";

describe("shareExportWithFallback", () => {
  it("falls back to text sharing when file sharing fails", async () => {
    const writeFile = jest.fn().mockResolvedValue(undefined);
    const shareFile = jest.fn().mockRejectedValue(new Error("no handler"));
    const shareText = jest.fn().mockResolvedValue(undefined);

    await expect(
      shareExportWithFallback({
        cacheDirectory: "file:///cache/",
        fileUri: "file:///cache/export.csv",
        message: "Transactions\namount",
        sharingAvailable: true,
        writeFile,
        shareFile,
        shareText,
      }),
    ).resolves.toBe("text");
    expect(writeFile).toHaveBeenCalledWith("file:///cache/export.csv", "Transactions\namount");
    expect(shareText).toHaveBeenCalledWith("Transactions\namount");
  });

  it("uses file sharing when it succeeds", async () => {
    const writeFile = jest.fn().mockResolvedValue(undefined);
    const shareFile = jest.fn().mockResolvedValue(undefined);
    const shareText = jest.fn().mockResolvedValue(undefined);

    await expect(
      shareExportWithFallback({
        cacheDirectory: "file:///cache/",
        fileUri: "file:///cache/export.csv",
        message: "payload",
        sharingAvailable: true,
        writeFile,
        shareFile,
        shareText,
      }),
    ).resolves.toBe("file");
    expect(shareText).not.toHaveBeenCalled();
  });
});
