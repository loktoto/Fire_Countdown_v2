export function shouldShowAssetNameError(name: string, wasTouched: boolean) {
  return wasTouched && name.trim().length === 0;
}
