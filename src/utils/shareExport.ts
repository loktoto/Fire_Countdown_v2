export type ExportShareOptions = {
  cacheDirectory: string | null | undefined;
  fileUri: string;
  message: string;
  sharingAvailable: boolean;
  writeFile: (fileUri: string, message: string) => Promise<void>;
  shareFile: (fileUri: string) => Promise<void>;
  shareText: (message: string) => Promise<unknown>;
};

/** Share a file when possible, falling back to a text payload when Android has
 * no compatible file-share target. The caller owns user-facing error handling.
 */
export async function shareExportWithFallback(options: ExportShareOptions) {
  if (options.sharingAvailable && options.cacheDirectory) {
    try {
      await options.writeFile(options.fileUri, options.message);
      await options.shareFile(options.fileUri);
      return "file" as const;
    } catch {
      // Continue to the platform text share below.
    }
  }

  await options.shareText(options.message);
  return "text" as const;
}
