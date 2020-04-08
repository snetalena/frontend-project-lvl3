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
  form.messageCode = null;
  // form.message.error = false;
  form.submitActive = true;
};

const markFormInvalid = (form, messageCode) => {
  form.submitActive = false;
  form.inputField.active = true;
  form.inputField.valid = messageCode ? false : true;
  form.messageCode = messageCode;
  // form.message.error = message ? true : false;
  form.submitActive = false;
};

const addParsedDataToState = (parsedData, state) => {
  const channelAdded = state.channels.find((channel) => channel.rssLink === parsedData.rssLink);
  const channelId = channelAdded ? channelAdded.id : uniqueId();
  state.channels.push({
    id: channelId,
    rssLink: parsedData.rssLink,
    title: parsedData.channelTitle,
    description: parsedData.channelDescription,
  });

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
      messageCode: null,
      // code: null,
      // error: false,
    },
    channels: [], // { id, rssLink, title, description }
    posts: [], // { id, channelId, title, link, pubDate }
    statusForm: 'filling',
  };

  const elements = {
    elementHeading: document.querySelector('.display-4'),
    elementJumb: document.querySelector('.jumbotron'),
    elementInput: document.querySelector('input'),
    elementButton: document.querySelector('.btn[type="submit"]'),
    elementChannels: document.getElementById('channels'),
    elementPosts: document.getElementById('posts'),
    elementForm: document.querySelector('form'),
  };

  renderForm(state, elements);
  renderChannels(state, elements);
  renderPosts(state, elements);

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

  elements.elementInput.focus();
  elements.elementInput.addEventListener('keyup', async (event) => {
    const currentText = event.target.value;
    state.form.inputField.text = currentText;

    if (!await schema.isValid({ website: currentText })) {
      markFormInvalid(state.form, 'invalidURL');
      return;
    }

    if (state.channels.find((el) => el.link === currentText)) {
      markFormInvalid(state.form, 'doublicatedURL');
      return;
    }

    markFormValid(state.form);
  });

  const filterNewChannelData = (parsedChannelData, state) => {
    // const newPosts = [];
    // parsedChannelData.posts.forEach((post) => {
    //   if (!state.posts.find((statePost) => statePost.link === post.link
    //   || statePost.title === post.title)) {
    //     newPosts.push({ title: post.title, link: post.link });
    //   }
    // });

    const maxPubDateAdded = state.posts.reduce(
      (acc, post) => (acc > post.pubDate ? acc : post.pubDate),
      0,
    );
    const newPosts = parsedChannelData.posts.filter((post) => post.pubDate > maxPubDateAdded);
    
    if (newPosts.length === 0) {
      return null;
    }
    return {
      rssLink: parsedChannelData.rssLink,
      channelTitle: parsedChannelData.channelTitle,
      channelDescription: parsedChannelData.channelDescription,
      posts: newPosts,
    };
  };

  const sendRequest = async (url) => {
    const proxy = 'cors-anywhere.herokuapp.com';
    const link = url.slice(url.indexOf('/') + 2);
    const response = await axios.get(`https://${proxy}/${link}`);

    const updatePosts = (state) => {
      state.channels.forEach(async (channel) => {
        const data = await sendRequest(channel.rssLink);
        // TODO: check response
        const newChannelData = filterNewChannelData(getChannelData(data), state);
        if (newChannelData) {
          addParsedDataToState(newChannelData);
        }
      });
    };

    setTimeout(() => updatePosts(state), 5000);
    return response.request.responseText;
  };

  elements.elementButton.addEventListener('click', async () => {
    state.statusForm = 'loading';
    const data = await sendRequest(state.form.inputField.text);
    // TODO: check response
    const parsedData = getChannelData(data);
    parsedData.rssLink = state.form.inputField.text;
    addParsedDataToState(parsedData, state);
    state.form.inputField.text = '';
    markFormInvalid(state.form, null);
    state.statusForm = 'filling';
  });

  // const buttonRefresh = document.querySelector('.btn-light');
  // buttonRefresh.addEventListener('click', async () => {
  //   updatePosts(state);
  // });
};

newFunc(); // TODO: fix
