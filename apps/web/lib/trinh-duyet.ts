export async function nhanDangTrinhDuyet(): Promise<string> {
  if (typeof navigator === "undefined") return "Trình duyệt không xác định";

  const ua = navigator.userAgent || "";
  const chrome = ua.match(/(?:Chrome|Chromium)\/(\d+)/)?.[1];
  const edge = ua.match(/Edg\/(\d+)/)?.[1];
  const firefox = ua.match(/Firefox\/(\d+)/)?.[1];
  const safari = !/Chrome|Chromium|Edg/.test(ua) ? ua.match(/Version\/(\d+).+Safari/)?.[1] : undefined;

  let he_dieu_hanh = "Thiết bị không xác định";
  if (/Windows NT 10\.0/.test(ua)) he_dieu_hanh = "Windows 10/11";
  else if (/Windows/.test(ua)) he_dieu_hanh = "Windows";
  else if (/Android/.test(ua)) he_dieu_hanh = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) he_dieu_hanh = "iOS/iPadOS";
  else if (/Macintosh|Mac OS X/.test(ua)) he_dieu_hanh = "macOS";
  else if (/Linux/.test(ua)) he_dieu_hanh = "Linux";

  try {
    const brave = (navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } }).brave;
    if (brave?.isBrave && await brave.isBrave()) {
      return `Brave${chrome ? ` (Chromium ${chrome})` : ""} · ${he_dieu_hanh}`;
    }
  } catch {
    // Brave API có thể bị chặn trong một số chế độ riêng tư; tiếp tục nhận dạng UA thông thường.
  }

  if (edge) return `Microsoft Edge ${edge} · ${he_dieu_hanh}`;
  if (/OPR\//.test(ua)) return `Opera · ${he_dieu_hanh}`;
  if (firefox) return `Firefox ${firefox} · ${he_dieu_hanh}`;
  if (safari) return `Safari ${safari} · ${he_dieu_hanh}`;
  if (chrome) return `Google Chrome ${chrome} · ${he_dieu_hanh}`;
  return `${ua.slice(0, 100) || "Trình duyệt không xác định"} · ${he_dieu_hanh}`;
}

export function hienThiNhanTrinhDuyet(ghi_nhan?: string | null): string {
  if (!ghi_nhan) return "Thiết bị không xác định";
  if (!ghi_nhan.startsWith("Mozilla/")) return ghi_nhan;

  const chrome = ghi_nhan.match(/(?:Chrome|Chromium)\/(\d+)/)?.[1];
  const edge = ghi_nhan.match(/Edg\/(\d+)/)?.[1];
  const firefox = ghi_nhan.match(/Firefox\/(\d+)/)?.[1];
  const windows = /Windows NT 10\.0/.test(ghi_nhan) ? "Windows 10/11" : /Windows/.test(ghi_nhan) ? "Windows" : "Thiết bị cũ";
  if (edge) return `Microsoft Edge ${edge} · ${windows}`;
  if (firefox) return `Firefox ${firefox} · ${windows}`;
  if (chrome) return `Chromium ${chrome} · ${windows} (phiên cũ chưa phân biệt Brave/Chrome)`;
  return `Trình duyệt phiên cũ · ${windows}`;
}
