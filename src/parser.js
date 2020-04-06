import axios from 'axios';

export const getParsedChannel = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  // TODO: check if xml
  const channelTitle = doc.querySelector('title').textContent;
  const channelDescription = doc.querySelector('description').textContent;
  const items = [...doc.querySelectorAll('item')];

  const posts = items.map((post) => {
    const title = post.querySelector('title').textContent;
    const link = post.querySelector('link').textContent;
    return { title, link };
  });

  return {
    channelTitle, channelDescription, posts,
  };
};

export const sendRequest = async (url) => {
  const proxy = 'cors-anywhere.herokuapp.com';
  const link = url.slice(url.indexOf('/') + 2);
  const response = await axios.get(`https://${proxy}/${link}`);
  return response.request.responseText;
};
