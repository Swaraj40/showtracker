async function test() {
  const res = await fetch('https://www.imdb.com/title/tt0903747/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'text/html'
    }
  });
  const text = await res.text();
  console.log('Length:', text.length);
  const ratingMatch = text.match(/"aggregateRating":\{"@type":"AggregateRating","ratingCount":[^,]+,"bestRating":"10","worstRating":"1","ratingValue":([^}]+)\}/);
  console.log('Rating:', ratingMatch ? ratingMatch[1] : 'Not found');
}
test();
