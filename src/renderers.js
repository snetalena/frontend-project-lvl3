import i18next from 'i18next';
import resources from './locales';

const elements = {
  heading: document.querySelector('.display-4'),
  input: document.querySelector('input'),
  button: document.querySelector('.btn[type="submit"]'),
  channels: document.getElementById('channels'),
  posts: document.getElementById('posts'),
  form: document.querySelector('form'),
  feedback: document.getElementById('feedback'),
  spinner: document.getElementById('spinner'),
};

i18next.init({
  lng: window.navigator.language.slice(0, 2),
  debug: true,
  resources,
}).then(() => {
  elements.button.textContent = i18next.t('mainButton');
  elements.heading.textContent = i18next.t('heading');
});

export const renderForm = (state) => {
  elements.button.classList.remove('disabled');
  if (!state.form.submitActive || state.form.inputField.text === '') {
    elements.button.classList.add('disabled');
  }

  elements.input.classList.remove('is-invalid');
  elements.input.value = state.form.inputField.text;
  if (!state.form.inputField.valid && state.form.inputField.text !== '') {
    elements.input.classList.add('is-invalid');
  }

  while (elements.feedback.classList.length > 0) {
    elements.feedback.classList.remove(elements.feedback.classList.item(0));
  }
  elements.feedback.innerHTML = '';
  if (state.form.message.code) {
    elements.feedback.textContent = state.form.message.type === 'errorRequest'
      ? i18next.t('messages.errorRequest', { code: state.form.message.code })
      : i18next.t(`messages.${state.form.message.code}`);
    if (state.form.message.type === 'success') {
      elements.feedback.classList.add('feedback', 'text-success', 'pt-2');
      return;
    }
    elements.feedback.classList.add('feedback', 'text-danger', 'pt-2');
  }
};

export const renderPosts = (state) => {
  elements.posts.innerHTML = '';
  if (state.posts.length === 0) {
    return;
  }
  const activeChannel = elements.channels.querySelector('.list-group-item-primary');
  const activeChannelId = activeChannel.getAttribute('id');
  const activePosts = activeChannelId === 'all'
    ? state.posts
    : state.posts.filter((post) => post.channelId === activeChannelId);

  const ulPosts = document.createElement('ul');
  ulPosts.classList.add('list-group');
  activePosts.forEach((post) => {
    const liPost = document.createElement('li');
    liPost.classList.add('list-group-item');
    liPost.setAttribute('channelId', post.channelId);
    const link = document.createElement('a');
    link.setAttribute('href', post.link);
    link.textContent = post.title;
    liPost.append(link);
    ulPosts.appendChild(liPost);
  });
  elements.posts.append(ulPosts);
};

export const renderChannels = (state) => {
  elements.channels.innerHTML = '';
  if (state.channels.length === 0) {
    return;
  }
  const ulChannels = document.createElement('ul');
  ulChannels.classList.add('list-group');

  const allChannel = document.createElement('li');
  allChannel.textContent = i18next.t('allChannels');
  allChannel.setAttribute('id', 'all');
  allChannel.classList.add('list-group-item', 'list-group-item-action', 'list-group-item-primary');
  ulChannels.appendChild(allChannel);

  state.channels.forEach((channel) => {
    const liChannel = document.createElement('li');
    liChannel.classList.add('list-group-item', 'list-group-item-action');
    liChannel.textContent = `${channel.title}: ${channel.description}`;
    liChannel.setAttribute('id', channel.id);
    ulChannels.appendChild(liChannel);
  });
  elements.channels.append(ulChannels);

  ulChannels.addEventListener('click', (event) => {
    const activeChannel = ulChannels.querySelector('.list-group-item-primary');
    if (activeChannel) {
      activeChannel.classList.remove('list-group-item-primary');
    }
    event.target.classList.add('list-group-item-primary');
    renderPosts(state, elements);
  });
};

export const renderSpinner = (state) => {
  switch (state.statusForm) {
    case 'loading':
      elements.spinner.innerHTML = `<strong>Loading...</strong>
      <div class="spinner-border ml-auto" role="status" aria-hidden="true"></div>`;
      break;
    case 'filling':
      elements.spinner.innerHTML = '';
      break;
    default:
      throw new Error(`Unknown statusForm: '${state.statusForm}'!`);
  }
};
