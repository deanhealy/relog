export async function fetchCoverBlob(url: string): Promise<Blob | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}
