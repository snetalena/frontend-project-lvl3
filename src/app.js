import * as yup from 'yup';
import { watch } from 'melanke-watchjs';
import { uniqueId } from 'lodash';
import { renderForm, renderChannels, renderSpinner } from './renderers';
import { getParsedChannel, sendRequest } from './parser';

const markFormValid = (state) => {
  state.form.submitActive = true;
  state.form.inputField.active = true;
  state.form.inputField.valid = true;
  state.form.message.text = null;
  state.form.message.error = false;
  state.form.submitActive = true;
};

const markFormInvalid = (state, message) => {
  state.form.submitActive = false;
  state.form.inputField.active = true;
  state.form.inputField.valid = message ? false: true;
  state.form.message.text = message;
  state.form.message.error = message ? true : false;
  state.form.submitActive = false;
};

const addParsedDataToState = (parsedData, state) => {
  const channelId = uniqueId();
  state.channels.push({
    id: channelId,
    link: parsedData.rssLink,
    title: parsedData.channelTitle,
    description: parsedData.channelDescription,
  });
  parsedData.posts.forEach((post) => {
    state.posts.push({
      id: uniqueId(),
      channelId,
      title: post.title,
      link: post.link,
    });
  });
};

export default async () => {
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
        text: null,
        error: false,
      },
    },
    channels: [], // { id, rssLink, title, description }
    posts: [], // { id, channelId, title, link }
    statusForm: 'filling',
  };

  const elements = {
    elementJumb: document.querySelector('.jumbotron'),
    elementInput: document.querySelector('input'),
    elementButton: document.querySelector('.btn[type="submit"]'),
    elementLists: document.getElementById('lists'),
  };

  renderForm(state, elements);
  renderChannels(state, elements);

  watch(state, 'form', () => {
    renderForm(state, elements);
  });

  watch(state, 'channels', () => {
    renderChannels(state, elements);
  });

  watch(state, 'statusForm', () => {
    renderSpinner(state, elements);
  });

  elements.elementInput.focus();
  elements.elementInput.addEventListener('keyup', async (event) => {
    const currentText = event.target.value;
    state.form.inputField.text = currentText;

    if (!await schema.isValid({ website: currentText })) {
      markFormInvalid(state, 'invalid URL!');
      return;
    }

    if (state.channels.find((el) => el.link === currentText)) {
      markFormInvalid(state, 'doublicated URL!');
      return;
    }

    markFormValid(state);
  });

  elements.elementButton.addEventListener('click', async () => {
    state.statusForm = 'loading';
    const data = await sendRequest(state.form.inputField.text);
    // TODO: check response
    const parsedData = getParsedChannel(data);
    parsedData.rssLink = state.form.inputField.text;
    addParsedDataToState(parsedData, state);
    state.form.inputField.text = '';
    markFormInvalid(state, null);
    state.statusForm = 'filling';
  });
};
