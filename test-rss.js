const http = require('https');
http.get('https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const extractTag = (xml, tag) => {
      const match = new RegExp(< + tag + [^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/ + tag + >|< + tag + [^>]*>([\\s\\S]*?)<\\/ + tag + >).exec(xml);
      return match?.[1] ?? match?.[2] ?? '';
    };
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    const items = [];
    while ((match = itemRegex.exec(data)) !== null && items.length < 3) {
      const item = match[1];
      const title = extractTag(item, 'title');
      const titleCleaned = title.replace(/<[^>]+>/g, '').trim();
      items.push({ title, titleCleaned });
    }
    console.log(items);
  });
});