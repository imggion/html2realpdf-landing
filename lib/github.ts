const repositoryApiUrl = "https://api.github.com/repos/imggion/html2realpdf";

export async function getRepositoryStars() {
  try {
    const response = await fetch(repositoryApiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 3_600 },
    });

    if (!response.ok) return null;

    const repository: unknown = await response.json();
    if (!repository || typeof repository !== "object") return null;

    const stars = (repository as { stargazers_count?: unknown }).stargazers_count;
    return typeof stars === "number" && Number.isInteger(stars) && stars >= 0
      ? stars
      : null;
  } catch {
    return null;
  }
}
