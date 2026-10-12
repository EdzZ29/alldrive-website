import type { StaticImageData } from "next/image";
import c01 from "@/public/images/customers/customer-01.webp";
import c02 from "@/public/images/customers/customer-02.webp";
import c03 from "@/public/images/customers/customer-03.webp";
import c04 from "@/public/images/customers/customer-04.webp";
import c05 from "@/public/images/customers/customer-05.webp";
import c06 from "@/public/images/customers/customer-06.webp";
import c07 from "@/public/images/customers/customer-07.webp";
import c08 from "@/public/images/customers/customer-08.webp";
import c09 from "@/public/images/customers/customer-09.webp";
import c10 from "@/public/images/customers/customer-10.webp";
import c11 from "@/public/images/customers/customer-11.webp";
import c12 from "@/public/images/customers/customer-12.webp";
import c13 from "@/public/images/customers/customer-13.webp";
import c14 from "@/public/images/customers/customer-14.webp";
import c15 from "@/public/images/customers/customer-15.webp";
import c16 from "@/public/images/customers/customer-16.webp";
import c17 from "@/public/images/customers/customer-17.webp";
import c18 from "@/public/images/customers/customer-18.webp";

/**
 * Customer photos for the gallery. Each has a star rating badge (4.5 to 5.0, picked at random
 * once and saved here so it stays the same on every page load). Add a photo by converting it to
 * public/images/customers/customer-NN.webp (720x960) and adding a line below.
 */
export const customerPhotos: { image: StaticImageData; rating: number }[] = [
  { image: c01, rating: 4.5 },
  { image: c02, rating: 4.9 },
  { image: c03, rating: 4.6 },
  { image: c04, rating: 4.5 },
  { image: c05, rating: 4.5 },
  { image: c06, rating: 4.5 },
  { image: c07, rating: 4.5 },
  { image: c08, rating: 4.5 },
  { image: c09, rating: 4.9 },
  { image: c10, rating: 4.6 },
  { image: c11, rating: 4.9 },
  { image: c12, rating: 4.6 },
  { image: c13, rating: 4.7 },
  { image: c14, rating: 4.8 },
  { image: c15, rating: 4.8 },
  { image: c16, rating: 4.7 },
  { image: c17, rating: 4.7 },
  { image: c18, rating: 5.0 },
];
