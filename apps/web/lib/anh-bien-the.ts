const MAT_NA_THEO_SLUG: Record<string, string> = {
  "xe-rc-dragon-r1-in-3d": "5,71 8,58 18,46 35,37 55,35 74,40 91,52 96,67 90,82 67,88 42,88 19,84 8,78",
  "gia-do-dien-thoai-banh-rang": "24,88 20,72 27,57 33,43 35,25 45,15 62,18 70,32 72,49 80,66 76,84 61,91 43,91",
  "chau-cay-xoan-oc-hien-dai": "27,91 22,76 24,57 29,39 38,21 50,12 63,20 72,39 77,57 78,76 70,91",
  "hop-cuon-cap-di-dong": "13,75 15,39 27,24 51,19 75,27 86,44 85,73 69,85 36,86",
  "gia-treo-tai-nghe-doi": "14,88 18,17 28,9 38,14 43,43 57,43 62,14 72,9 82,17 86,88 71,92 50,83 29,92",
  "chup-den-radiant": "26,91 21,71 25,47 31,25 40,10 59,10 69,25 75,47 79,71 73,91",
  "khoi-lap-phuong-banh-rang": "10,83 8,31 24,11 75,9 92,28 91,78 74,92 25,93",
  "khay-gridfinity-da-nang": "5,87 6,20 18,7 83,7 95,21 95,87",
  "den-lithophane-theo-anh": "22,92 19,25 31,8 68,8 81,25 78,92",
  "vo-raspberry-pi-5-thoang-khi": "7,77 8,42 21,28 73,25 93,40 93,71 82,84 24,87"
};

export function anhBienTheUrl(duong_dan: string, anh_goc: string, ma_hex?: string) {
  if (!anh_goc || !ma_hex || anh_goc.startsWith("data:image/")) return anh_goc;
  const points = MAT_NA_THEO_SLUG[duong_dan] || "8,84 8,24 24,10 76,10 92,24 92,84 76,94 24,94";
  const q = new URLSearchParams({ src: anh_goc, mau: ma_hex, points });
  return `/api/anh-bien-the?${q.toString()}`;
}
