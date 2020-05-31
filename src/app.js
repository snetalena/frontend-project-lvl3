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

const filterRSSData = (dataRSS, state) => {
  const newPosts = _.differenceBy(dataRSS.posts, state.posts, 'link', 'title');
  return {
    rssLink: dataRSS.rssLink,
    channelTitle: dataRSS.channelTitle,
    channelDescription: dataRSS.channelDescription,
    posts: newPosts,
  };
};

const addChannelDataToState = (dataRSS, state) => {
  state.channels.push({
    id: _.uniqueId(),
    rssLink: dataRSS.rssLink,
    title: dataRSS.channelTitle,
    description: dataRSS.channelDescription,
  });
};

const addPostsDataToState = (dataRSS, state) => {
  const currentChannel = state.channels.find((channel) => channel.rssLink === dataRSS.rssLink);
  dataRSS.posts.forEach((post) => {
    state.posts.push({
      id: _.uniqueId(),
      channelId: currentChannel.id,
      title: post.title,
      link: post.link,
      pubDate: post.pubDate,
    });
  });
};

const getRSSdataFromUrl = (url) => sendRequest(url)
  .then((response) => parseRSS(response.data));

const updateRSSdataInState = (url, state) => getRSSdataFromUrl(url)
  .then((RSSdata) => {
    const newRSSdata = filterRSSData(RSSdata, state);
    addPostsDataToState(newRSSdata, state);
  });

export default () => {
  i18next.init({
    lng: window.navigator.language.slice(0, 2),
    debug: true,
    resources,
  });

  const errorMessages = {
    request: (statusCode) => statusCode,
    url: {
      valid: 'invalidURL',
      doublicated: 'doublicatedURL',
    },
  };

  const state = {
    form: {
      valid: true,
      inputText: null,
      processState: 'filling',
    },
    errors: { message: '' },
    channels: [], // { id, rssLink, title, description }
    posts: [], // { id, channelId, title, link }
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
      .map((channel) => updateRSSdataInState(channel.rssLink, state));
    Promise.all(promises)
      .finally(() => setTimeout(() => updatePosts(), 5000));
  };
  updatePosts(state);

  watch(state, 'form', () => {
    renderForm(state, elements, i18next);
  });

  watch(state, 'channels', () => {
    renderChannels(state, elements, i18next);
  });

  watch(state, 'posts', () => {
    renderPosts(state, elements);
  });

  const validateURL = (url, addedRSSurls) => {
    const schema = yup.object()
      .shape({
        website: yup
          .string()
          .url(errorMessages.url.valid)
          .notOneOf(addedRSSurls, errorMessages.url.doublicated),
      });

    return schema.validate({ website: url });
  };

  const updateValidationState = () => {
    const errors = {};
    const addedRSSurls = state.channels.map((channel) => channel.rssLink);
    validateURL(state.form.inputText, addedRSSurls)
      .catch((err) => {
        errors.message = err.errors;
      })
      .finally(() => {
        state.errors = errors;
        state.form.valid = _.isEqual(errors, {});
      });
  };

  elements.input.addEventListener('keyup', async (event) => {
    const currentText = event.target.value;
    state.form.inputText = currentText;
    state.form.processState = 'filling';
    updateValidationState();
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.form.processState = 'sending';

    const url = state.form.inputText;
    getRSSdataFromUrl(url)
      .then((RSSdata) => {
        // eslint-disable-next-line no-param-reassign
        RSSdata.rssLink = url;
        addChannelDataToState(RSSdata, state);
        addPostsDataToState(RSSdata, state);
        state.form.inputText = '';
        state.form.processState = 'successed';
      })
      .catch((err) => {
        state.errors.message = errorMessages.request(err.response.status);
        state.form.valid = false;
        state.form.processState = 'failed';
      });
  });
};
