import * as yup from 'yup';
import i18next from 'i18next';
import { watch } from 'melanke-watchjs';
import _ from 'lodash';
import axios from 'axios';
import {
  renderForm, renderChannels, renderPosts,
} from './renderers';
import getChannelData from './parser';
import resources from './locales';

i18next.init({
  lng: window.navigator.language.slice(0, 2),
  debug: true,
  resources,
});

const sendRequest = (url) => {
  const proxy = 'https://cors-anywhere.herokuapp.com';
  return axios.get(`${proxy}/${url}`);
};

const filterChannelData = (channelData, state) => {
  const newPosts = _.differenceBy(channelData.posts, state.posts, 'link', 'title');
  return {
    rssLink: channelData.rssLink,
    channelTitle: channelData.channelTitle,
    channelDescription: channelData.channelDescription,
    posts: newPosts,
  };
};

const addChannelDataToState = (channelData, state) => {
  const channel = state.channels.find((chan) => chan.rssLink === channelData.rssLink);
  const channelId = channel ? channel.id : _.uniqueId();
  if (!channel) {
    state.channels.push({
      id: channelId,
      rssLink: channelData.rssLink,
      title: channelData.channelTitle,
      description: channelData.channelDescription,
    });
  }
  channelData.posts.forEach((post) => {
    state.posts.push({
      id: _.uniqueId(),
      channelId,
      title: post.title,
      link: post.link,
      pubDate: post.pubDate,
    });
  });
};

const upsertChannelDataFromUrl = (url, state) => sendRequest(url)
  .then((response) => getChannelData(response.data))
  .then((channelData) => {
    // eslint-disable-next-line no-param-reassign
    channelData.rssLink = url;
    return filterChannelData(channelData, state);
  })
  .then((filteredData) => addChannelDataToState(filteredData, state));

export default () => {
  const schema = yup.object().shape({
    website: yup.string().url(),
  });

  const state = {
    RSSprocess: {
      state: 'filling', // filling/sending/failed/sucessed
      error: null,
    },
    form: {
      valid: true,
      inputText: null,
    },
    channels: [], // { id, rssLink, title, description }
    posts: [], // { id, channelId, title, link, pubDate }
  };

  const elements = {
    heading: document.querySelector('.display-4'),
    input: document.querySelector('input'),
    button: document.querySelector('.btn[type="submit"]'),
    spinner: document.getElementById('spinner'),
    form: document.querySelector('form'),
    posts: document.getElementById('posts'),
    channels: document.getElementById('channels'),
    feedback: document.getElementById('feedback'),
  };

  renderForm(state, elements, i18next);
  renderChannels(state, elements, i18next);
  renderPosts(state, elements);

  const updatePosts = () => {
    const promises = state.channels
      .map((channel) => upsertChannelDataFromUrl(channel.rssLink, state));
    Promise.all(promises)
      .finally(() => setTimeout(() => updatePosts(), 5000));
  };
  updatePosts(state);

  watch(state, 'RSSprocess', () => {
    renderForm(state, elements, i18next);
  });

  watch(state, 'channels', () => {
    renderChannels(state, elements, i18next);
  });

  watch(state, 'posts', () => {
    renderPosts(state, elements);
  });

  elements.input.addEventListener('keyup', async (event) => {
    const currentText = event.target.value;
    state.form.inputText = currentText;
    state.RSSprocess.state = 'filling';

    if (state.channels.find((el) => el.rssLink === currentText)) {
      state.RSSprocess.error = 'doublicatedURL';
      state.form.valid = false;
      return;
    }

    schema.isValid({ website: currentText })
      .then((valid) => {
        if (valid) {
          state.RSSprocess.error = null;
          state.form.valid = true;
          return;
        }
        state.RSSprocess.error = 'invalidURL';
        state.form.valid = false;
      });
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.RSSprocess.state = 'sending';

    upsertChannelDataFromUrl(state.form.inputText, state)
      .then(() => {
        state.form.inputText = '';
        state.RSSprocess.error = null;
        state.RSSprocess.state = 'successed';
      })
      .catch((err) => {
        state.RSSprocess.error = err.response.status;
        state.RSSprocess.state = 'failed';
      });
  });
};
