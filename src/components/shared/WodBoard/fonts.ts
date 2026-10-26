import { Kalam, Permanent_Marker } from "next/font/google";

// Handwriting for the chalkboard only; the rest of the app stays Geist.
export const markerFont = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap" });
export const handFont = Kalam({ weight: "400", subsets: ["latin"], display: "swap" });
