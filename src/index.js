import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
// import app from './app';

// app();

import * as yup from 'yup';
import { watch } from 'melanke-watchjs';
import { uniqueId } from 'lodash';
import axios from 'axios';
import {
  renderForm, renderChannels, renderPosts, renderSpinner,
} from './renderers';
import getChannelData from './parser';

const markFormValid = (form) => {
  form.submitActive = true;
  form.inputField.active = true;
  form.inputField.valid = true;
  form.message.code = null;
  // form.message.error = false;
  form.submitActive = true;
};

const markFormInvalid = (form, messageCode) => {
  form.submitActive = false;
  form.inputField.active = true;
  form.inputField.valid = messageCode === 'successLoad';
  form.message.code = messageCode;
  // form.message.error = message ? true : false;
  form.submitActive = false;
};

const sendRequest = (url) => {
  const proxy = 'cors-anywhere.herokuapp.com';
  // TODO: handle http
  const link = url.slice(url.indexOf('/') + 2);
  return axios.get(`https://${proxy}/${link}`);
};

const filterNewChannelData = (parsedChannelData, state) => {
  const newPosts = [];
  parsedChannelData.posts.forEach((post) => {
    if (!state.posts.find((statePost) => statePost.link === post.link
      && statePost.title === post.title)) {
      newPosts.push({ title: post.title, link: post.link });
    }
  });
  // const maxPubDateAdded = state.posts.reduce(
  //   (acc, post) => (acc > post.pubDate ? acc : post.pubDate),
  //   0,
  // );
  // const newPosts = parsedChannelData.posts.filter((post) => post.pubDate > maxPubDateAdded);

  // if (newPosts.length === 0) {
  //   return null;
  // }
  return {
    rssLink: parsedChannelData.rssLink,
    channelTitle: parsedChannelData.channelTitle,
    channelDescription: parsedChannelData.channelDescription,
    posts: newPosts,
  };
};

const addParsedDataToState = (parsedData, state) => {
  const channelExists = state.channels.find((channel) => channel.rssLink === parsedData.rssLink);
  const channelId = channelExists ? channelExists.id : uniqueId();
  if (!channelExists) {
    state.channels.push({
      id: channelId,
      rssLink: parsedData.rssLink,
      title: parsedData.channelTitle,
      description: parsedData.channelDescription,
    });
  }
  parsedData.posts.forEach((post) => {
    state.posts.push({
      id: uniqueId(),
      channelId,
      title: post.title,
      link: post.link,
      pubDate: post.pubDate,
    });
  });
};

const upsertFromUrl = (url, state) => sendRequest(url)
  .then((response) => getChannelData(response.request.responseText))
  .then((channelData) => {
    channelData.rssLink = url;
    return filterNewChannelData(channelData, state);
  })
  .then((filteredData) => addParsedDataToState(filteredData, state));
  // .catch((error) => Promise.reject(new Error(error.response.status)));

const newFunc = () => {
  //  export default async () => {
  const schema = yup.object().shape({
    website: yup.string().url(),
  });

  const state = {
    form: {
      submitActive: false,
      inputField: {
        text: null,
        active: true,
        valid: true,
      },
      // messageCode: null,
      message: {
        code: null,
        type: null, // errorRequest, errorUrl, success
      },
    },
    channels: [], // { id, rssLink, title, description }
    posts: [], // { id, channelId, title, link, pubDate }
    statusForm: 'filling',
  };

  const elements = {
    elementHeading: document.querySelector('.display-4'),
    elementInput: document.querySelector('input'),
    elementButton: document.querySelector('.btn[type="submit"]'),
    elementChannels: document.getElementById('channels'),
    elementPosts: document.getElementById('posts'),
    elementForm: document.querySelector('form'),
    elementFeedback: document.getElementById('feedback'),
  };

  renderForm(state, elements);
  renderChannels(state, elements);
  renderPosts(state, elements);

  const updatePosts = () => {
    const promises = [];
    state.channels.forEach((channel) => {
      promises.push(upsertFromUrl(channel.rssLink, state));
    });
    Promise.all(promises)
      .finally(() => setTimeout(() => updatePosts(), 5000));
  };
  updatePosts(state);

  watch(state, 'form', () => {
    renderForm(state, elements);
  });

  watch(state, 'channels', () => {
    renderChannels(state, elements);
  });

  watch(state, 'posts', () => {
    renderPosts(state, elements);
  });

  watch(state, 'statusForm', () => {
    renderSpinner(state, elements);
  });

  const checkUrlValid = (url) => schema.isValid({ website: url }).then((valid) => {
    if (valid) {
      markFormValid(state.form);
      return;
    }
    state.form.message.type = 'errorUrl';
    markFormInvalid(state.form, 'invalidURL');
  });

  elements.elementInput.focus();
  elements.elementInput.addEventListener('keyup', async (event) => {
    const currentText = event.target.value;
    state.form.inputField.text = currentText;

    // if (!await schema.isValid({ website: currentText })) {
    //   markFormInvalid(state.form, 'invalidURL');
    //   return;
    // }
    // if (!state.form.inputField.valid) {
    //   return;
    // }

    if (state.channels.find((el) => el.rssLink === currentText)) {
      state.form.message.type = 'errorUrl';
      markFormInvalid(state.form, 'doublicatedURL');
      return;
    }

    checkUrlValid(currentText);

    // markFormValid(state.form);
  });

  elements.elementForm.addEventListener('submit', (event) => {
    event.preventDefault();
    state.statusForm = 'loading';
    upsertFromUrl(state.form.inputField.text, state)
      .then(() => {
        state.form.message.type = 'success';
        state.form.inputField.text = '';
        markFormInvalid(state.form, 'successLoad');
      })
      .catch((err) => {
        state.form.message.type = 'errorRequest';
        markFormInvalid(state.form, err.response.status);
      })
      .finally(() => {
        state.statusForm = 'filling';
      });
  });
};

newFunc(); // TODO: fix
