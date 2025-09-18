export function shortSlug(input, maxWords = 8) {
  return String(input)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join("-")
    .replace(/-+/g, "-");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(shortSlug(process.argv.slice(2).join(" ")));
}
