/**
 * Automated GitHub Profile README Updater
 * Zero dependencies - Runs on Node.js 18+ native fetch
 */

const fs = require('fs');
const path = require('path');

// Configuration: uses GH_USERNAME env, or process.env.GITHUB_REPOSITORY_OWNER, or fallback
const USERNAME = process.env.GH_USERNAME || process.env.GITHUB_REPOSITORY_OWNER || 'With-ALIF';
const TOKEN = process.env.GITHUB_TOKEN || '';

const README_PATH = path.join(__dirname, '..', 'README.md');
const START_MARKER = '<!-- START_UPDATE -->';
const END_MARKER = '<!-- END_UPDATE -->';

/**
 * Fetch helper with GitHub Authorization header
 */
async function fetchGitHub(endpoint) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Profile-Readme-Updater-Bot',
  };

  if (TOKEN) {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  const response = await fetch(`https://api.github.com/${endpoint}`, { headers });
  
  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.status} ${response.statusText} on /${endpoint}`);
  }
  
  return await response.json();
}

/**
 * Main execution function
 */
async function run() {
  console.log(`[+] Updating README for user: ${USERNAME}`);

  try {
    // 1. Fetch user public profile information
    const user = await fetchGitHub(`users/${USERNAME}`);
    
    // 2. Fetch user's public repositories (sorted by created date descending)
    const repos = await fetchGitHub(`users/${USERNAME}/repos?per_page=100&type=owner&sort=created&direction=desc`);

    // Calculate stats
    const totalStars = repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
    const totalForks = repos.reduce((acc, repo) => acc + (repo.forks_count || 0), 0);
    const totalRepos = user.public_repos || repos.length;
    const followers = user.followers || 0;
    const following = user.following || 0;

    // 3. Filter top 6 newest created public, non-fork project repositories
    const recentRepos = repos
      .filter(repo => !repo.private && !repo.fork && !repo.archived && repo.name.toLowerCase() !== USERNAME.toLowerCase())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);

    // 4. Generate dynamic markdown content
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'full',
      timeStyle: 'medium',
    }) + ' (GMT+6)';

    let dynamicContent = `\n<!-- START_UPDATE -->\n`;

    dynamicContent += `\n## GitHub Stats\n\n`;
    dynamicContent += `<p align="center">\n`;
    dynamicContent += `  <a href="https://github.com/${USERNAME}">\n`;
    dynamicContent += `    <img src="https://github-readme-stats.shion.dev/api?username=${USERNAME}&show_icons=true&theme=github_dark&hide_border=false&border_radius=8&custom_title=ALIF's%20GitHub%20Stats" alt="ALIF's GitHub Stats" width="49%" />\n`;
    dynamicContent += `  </a>\n`;
    dynamicContent += `  <a href="https://github.com/${USERNAME}">\n`;
    dynamicContent += `    <img src="https://streak-stats.demolab.com/?user=${USERNAME}&theme=github_dark&hide_border=false&border_radius=8" alt="GitHub Streak" width="49%" />\n`;
    dynamicContent += `  </a>\n`;
    dynamicContent += `</p>\n\n`;

    dynamicContent += `<p align="center">\n`;
    dynamicContent += `  <a href="https://github.com/${USERNAME}">\n`;
    dynamicContent += `    <img src="https://github-readme-stats.shion.dev/api/top-langs/?username=${USERNAME}&layout=compact&theme=github_dark&hide_border=false&border_radius=8&langs_count=10&hide=nix" alt="Top Languages" width="60%" />\n`;
    dynamicContent += `  </a>\n`;
    dynamicContent += `</p>\n\n`;

    dynamicContent += `<p align="center">\n`;
    dynamicContent += `  <img src="https://img.shields.io/badge/Total%20Stars-${totalStars}-yellow?style=for-the-badge&logo=star&logoColor=black" alt="Total Stars" />\n`;
    dynamicContent += `  <img src="https://img.shields.io/badge/Public%20Repos-${totalRepos}-blue?style=for-the-badge&logo=github&logoColor=white" alt="Public Repos" />\n`;
    dynamicContent += `  <img src="https://img.shields.io/badge/Followers-${followers}-green?style=for-the-badge&logo=github&logoColor=white" alt="Followers" />\n`;
    dynamicContent += `  <img src="https://img.shields.io/badge/Following-${following}-purple?style=for-the-badge&logo=github&logoColor=white" alt="Following" />\n`;
    dynamicContent += `</p>\n\n`;

    dynamicContent += `## Contribution Activity Snake\n\n`;
    dynamicContent += `<picture>\n`;
    dynamicContent += `  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${USERNAME}/${USERNAME}/main/dist/github-contribution-grid-snake-dark.svg">\n`;
    dynamicContent += `  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${USERNAME}/${USERNAME}/main/dist/github-contribution-grid-snake.svg">\n`;
    dynamicContent += `  <img alt="GitHub Contribution Snake Animation" src="https://raw.githubusercontent.com/${USERNAME}/${USERNAME}/main/dist/github-contribution-grid-snake.svg" width="100%">\n`;
    dynamicContent += `</picture>\n\n`;

    dynamicContent += `## Latest Active Projects\n\n`;

    if (recentRepos.length > 0) {
      for (let i = 0; i < recentRepos.length; i += 2) {
        const repo1 = recentRepos[i];
        const repo2 = recentRepos[i + 1];

        dynamicContent += `<p align="center">\n`;
        dynamicContent += `  <a href="${repo1.html_url}">\n`;
        dynamicContent += `    <img src="https://github-readme-stats.shion.dev/api/pin/?username=${USERNAME}&repo=${repo1.name}&theme=github_dark&hide_border=false&border_radius=8" alt="${repo1.name}" width="49%" />\n`;
        dynamicContent += `  </a>\n`;

        if (repo2) {
          dynamicContent += `  <a href="${repo2.html_url}">\n`;
          dynamicContent += `    <img src="https://github-readme-stats.shion.dev/api/pin/?username=${USERNAME}&repo=${repo2.name}&theme=github_dark&hide_border=false&border_radius=8" alt="${repo2.name}" width="49%" />\n`;
          dynamicContent += `  </a>\n`;
        }

        dynamicContent += `</p>\n\n`;
      }
    } else {
      dynamicContent += `*No active public repositories found.*\n\n`;
    }

    dynamicContent += `<!-- END_UPDATE -->`;

    // 5. Read and safely replace content in README.md
    if (!fs.existsSync(README_PATH)) {
      console.warn(`[!] README.md not found at ${README_PATH}.`);
      return;
    }

    const currentReadme = fs.readFileSync(README_PATH, 'utf-8');

    let updatedReadme = '';
    const startIndex = currentReadme.indexOf(START_MARKER);
    const endIndex = currentReadme.indexOf(END_MARKER);

    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      // Marker exists: Safely replace ONLY inside markers
      const beforeContent = currentReadme.substring(0, startIndex);
      const afterContent = currentReadme.substring(endIndex + END_MARKER.length);
      updatedReadme = beforeContent + dynamicContent.trim() + afterContent;
    } else {
      // Markers missing: Append safely at bottom without destroying existing content
      console.log(`[!] Markers not found. Appending dynamic section at the end.`);
      updatedReadme = currentReadme.trim() + `\n\n` + dynamicContent.trim() + `\n`;
    }

    // Write updated content to README
    fs.writeFileSync(README_PATH, updatedReadme, 'utf-8');
    console.log(`[✓] README.md dynamic section updated successfully!`);

  } catch (error) {
    console.error(`[X] Error updating README:`, error.message);
    process.exit(1);
  }
}

run();
