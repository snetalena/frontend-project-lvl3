import * as yup from 'yup';
import i18next from 'i18next';
import { watch } from 'melanke-watchjs';
import _ from 'lodash';
import axios from 'axios';
import {
  renderForm, renderChannels, renderPosts,
} from './renderers';
import parseRSS from './parser';
import resources from './locales';

const sendRequest = (url) => {
  const proxy = 'https://cors-anywhere.herokuapp.com';
  return axios.get(`${proxy}/${url}`);
};

const filterRSSData = (RSSdata, state) => {
  const newPosts = _.differenceBy(RSSdata.posts, state.posts, 'link', 'title');
  return {
    rssLink: RSSdata.rssLink,
    channelTitle: RSSdata.channelTitle,
    channelDescription: RSSdata.channelDescription,
    posts: newPosts,
  };
};

const addRSSdataToState = (RSSdata, state) => {
  const channelInState = state.channels.find((channel) => channel.rssLink === RSSdata.rssLink);
  const channelId = channelInState ? channelInState.id : _.uniqueId();
  if (!channelInState) {
    state.channels.push({
      id: channelId,
      rssLink: RSSdata.rssLink,
      title: RSSdata.channelTitle,
      description: RSSdata.channelDescription,
    });
  }
  RSSdata.posts.forEach((post) => {
    state.posts.push({
      id: _.uniqueId(),
      channelId,
      title: post.title,
      link: post.link,
      pubDate: post.pubDate,
    });
  });
};

const upsertRSSdataFromUrl = (url, state) => sendRequest(url)
  .then((response) => parseRSS(response.data))
  .then((RSSdata) => {
    // eslint-disable-next-line no-param-reassign
    RSSdata.rssLink = url;
    const filteredRSSdata = filterRSSData(RSSdata, state);
    addRSSdataToState(filteredRSSdata, state);
  });

export default () => {
  const schema = yup.object().shape({
    website: yup.string().url(),
  });

  i18next.init({
    lng: window.navigator.language.slice(0, 2),
    debug: true,
    resources,
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
      .map((channel) => upsertRSSdataFromUrl(channel.rssLink, state));
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

  const validateURL = (url) => schema.isValid({ website: url })
    .then((valid) => {
      if (!valid) {
        return 'invalidURL';
      }
      if (state.channels.find((channel) => channel.rssLink === url)) {
        return 'doublicatedURL';
      }
      return null;
    });

  const updateValidationState = () => {
    validateURL(state.form.inputText)
      .then((error) => {
        state.RSSprocess.error = error;
        state.form.valid = !error;
      });
  };

  elements.input.addEventListener('keyup', async (event) => {
    const currentText = event.target.value;
    state.form.inputText = currentText;
    state.RSSprocess.state = 'filling';
    updateValidationState();
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.RSSprocess.state = 'sending';

    upsertRSSdataFromUrl(state.form.inputText, state)
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
