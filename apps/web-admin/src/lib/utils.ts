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
