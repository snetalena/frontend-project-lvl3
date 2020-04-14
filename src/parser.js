const getChannelData = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  // TODO: check if xml?
  const channelTitle = doc.querySelector('title').textContent;
  const channelDescription = doc.querySelector('description').textContent;
  const items = [...doc.querySelectorAll('item')];

  const posts = items.map((post) => {
    const title = post.querySelector('title').textContent;
    const link = post.querySelector('link').textContent;
    const pubDate = new Date(post.querySelector('pubDate').textContent).toString();
    return { title, link, pubDate };
  });

  return {
    channelTitle, channelDescription, posts,
  };
};

export default getChannelData;
