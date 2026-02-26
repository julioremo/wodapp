import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD") // 1. Split accents from letters (é -> e + ´)
    .replace(/[\u0300-\u036f]/g, "") // 2. Remove the accents
    .toLowerCase()
    .trim() // 3. Remove whitespace from both ends
    .replace(/\s+/g, "-") // 4. Replace spaces with -
    .replace(/[^\w-]+/g, "") // 5. Remove all non-word chars
    .replace(/--+/g, "-"); // 6. Replace multiple - with single -
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
