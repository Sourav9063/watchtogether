const parseM3U = (m3uContent) => {
  const lines = m3uContent.split("\n");
  const channels = [];
  let currentChannel = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#EXTINF:")) {
      const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupTitleMatch = line.match(/group-title="([^"]+)"/);
      const nameMatch = line.match(/,(.*)/);

      currentChannel = {
        name: nameMatch ? nameMatch[1].trim() : "Unknown Channel",
        group: groupTitleMatch ? groupTitleMatch[1] : "Unknown Group",
        logo: tvgLogoMatch ? tvgLogoMatch[1] : "",
        url: "",
      };
    } else if (line.startsWith("http")) {
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = {}; // Reset for the next channel
    }
  }
  return channels;
};

const fetchM3U = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return parseM3U(text);
  } catch (e) {
    console.error("Error fetching M3U:", e);
    return [];
  }
};

export { fetchM3U };