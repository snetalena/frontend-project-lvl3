import * as yup from 'yup';
import { watch } from 'melanke-watchjs';
import { uniqueId } from 'lodash';
import axios from 'axios';
import {
  renderForm, renderChannels, renderPosts, renderSpinner,
} from './renderers';
import getChannelData from './parser';

const sendRequest = (url) => {
  const proxy = 'cors-anywhere.herokuapp.com';
  const link = url.slice(url.indexOf('/') + 2);
  return axios.get(`https://${proxy}/${link}`);
};

const filterChannelData = (channelData, state) => {
  const newPosts = [];
  channelData.posts.forEach((post) => {
    if (!state.posts.find((statePost) => statePost.link === post.link
      && statePost.title === post.title)) {
      newPosts.push({ title: post.title, link: post.link });
    }
  });

  return {
    rssLink: channelData.rssLink,
    channelTitle: channelData.channelTitle,
    channelDescription: channelData.channelDescription,
    posts: newPosts,
  };
};

const addChannelDataToState = (channelData, state) => {
  const channelExists = state.channels.find((channel) => channel.rssLink === channelData.rssLink);
  const channelId = channelExists ? channelExists.id : uniqueId();
  if (!channelExists) {
    state.channels.push({
      id: channelId,
      rssLink: channelData.rssLink,
      title: channelData.channelTitle,
      description: channelData.channelDescription,
    });
  }
  channelData.posts.forEach((post) => {
    state.posts.push({
      id: uniqueId(),
      channelId,
      title: post.title,
      link: post.link,
      pubDate: post.pubDate,
    });
  });
};

const upsertChannelDataFromUrl = (url, state) => sendRequest(url)
  .then((response) => getChannelData(response.request.responseText))
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
    form: {
      submitActive: false,
      inputField: {
        text: null,
        active: true,
        valid: true,
      },
      message: {
        code: null,
        type: null, // errorRequest, errorUrl, success
      },
    },
    channels: [], // { id, rssLink, title, description }
    posts: [], // { id, channelId, title, link, pubDate }
    statusForm: 'filling',
  };

  const markFormValid = () => {
    state.form.submitActive = true;
    state.form.inputField.active = true;
    state.form.inputField.valid = true;
    state.form.message.code = null;
    state.form.submitActive = true;
  };

  const markFormInvalid = (messageCode) => {
    state.form.submitActive = false;
    state.form.inputField.active = true;
    state.form.inputField.valid = messageCode === 'successLoad';
    state.form.message.code = messageCode;
    state.form.submitActive = false;
  };

  renderForm(state);
  renderChannels(state);
  renderPosts(state);

  const updatePosts = () => {
    const promises = [];
    state.channels.forEach((channel) => {
      promises.push(upsertChannelDataFromUrl(channel.rssLink, state));
    });
    Promise.all(promises)
      .finally(() => setTimeout(() => updatePosts(), 5000));
  };
  updatePosts(state);

  watch(state, 'form', () => {
    renderForm(state);
  });

  watch(state, 'channels', () => {
    renderChannels(state);
  });

  watch(state, 'posts', () => {
    renderPosts(state);
  });

  watch(state, 'statusForm', () => {
    renderSpinner(state);
  });

  const checkUrlValid = (url) => schema.isValid({ website: url }).then((valid) => {
    if (valid) {
      markFormValid();
      return;
    }
    state.form.message.type = 'errorUrl';
    markFormInvalid('invalidURL');
  });

  const elementInput = document.querySelector('input');
  elementInput.focus();
  elementInput.addEventListener('keyup', async (event) => {
    const currentText = event.target.value;
    state.form.inputField.text = currentText;

    if (state.channels.find((el) => el.rssLink === currentText)) {
      state.form.message.type = 'errorUrl';
      markFormInvalid('doublicatedURL');
      return;
    }

    checkUrlValid(currentText);
  });

  const elementForm = document.querySelector('form');
  elementForm.addEventListener('submit', (event) => {
    event.preventDefault();
    state.statusForm = 'loading';
    upsertChannelDataFromUrl(state.form.inputField.text, state)
      .then(() => {
        state.form.message.type = 'success';
        state.form.inputField.text = '';
        markFormInvalid('successLoad');
      })
      .catch((err) => {
        state.form.message.type = 'errorRequest';
        markFormInvalid(err.response.status);
      })
      .finally(() => {
        state.statusForm = 'filling';
      });
  });
};
