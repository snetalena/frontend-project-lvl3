export const renderForm = (state, i18next) => {
  const elements = {
    heading: document.querySelector('.display-4'),
    input: document.querySelector('input'),
    button: document.querySelector('.btn[type="submit"]'),
    form: document.querySelector('form'),
    feedback: document.getElementById('feedback'),
    spinner: document.getElementById('spinner'),
  };

  elements.button.textContent = i18next.t('mainButton');
  elements.heading.textContent = i18next.t('heading');

  elements.input.classList.remove('is-invalid');
  elements.input.classList.remove('disabled');
  elements.input.value = state.form.inputText;

  elements.button.classList.remove('disabled');

  elements.spinner.innerHTML = '';

  while (elements.feedback.classList.length > 0) {
    elements.feedback.classList.remove(elements.feedback.classList.item(0));
  }
  elements.feedback.innerHTML = '';

  switch (state.RSSprocess.state) {
    case 'filling':
      if (!state.form.valid) {
        elements.button.classList.add('disabled');
        elements.input.classList.add('is-invalid');
        elements.feedback.textContent = i18next.t(`messages.${state.RSSprocess.error}`);
        elements.feedback.classList.add('feedback', 'text-danger', 'pt-2');
      }
      break;

    case 'sending':
      elements.button.classList.add('disabled');
      elements.input.classList.add('disabled');
      elements.spinner.innerHTML = `<strong>Loading...</strong>
      <div class="spinner-border ml-auto" role="status" aria-hidden="true"></div>`;
      break;

    case 'failed':
      elements.feedback.textContent = i18next.t('messages.errorRequest', { code: state.RSSprocess.error });
      elements.feedback.classList.add('feedback', 'text-danger', 'pt-2');
      break;

    case 'successed':
      elements.feedback.textContent = i18next.t('messages.successLoad');
      elements.feedback.classList.add('feedback', 'text-success', 'pt-2');
      break;

    default:
      throw new Error(`Unknown : RSSprocess.state '${state.RSSprocess.state}'!`);
  }
};

export const renderPosts = (state) => {
  const elPosts = document.getElementById('posts');
  const elChannels = document.getElementById('channels');

  elPosts.innerHTML = '';
  if (state.posts.length === 0) {
    return;
  }

  const activeChannel = elChannels.querySelector('.list-group-item-primary');
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
  elPosts.append(ulPosts);
};

export const renderChannels = (state, i18next) => {
  const elChannels = document.getElementById('channels');
  elChannels.innerHTML = '';
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
  elChannels.append(ulChannels);

  ulChannels.addEventListener('click', (event) => {
    const activeChannel = ulChannels.querySelector('.list-group-item-primary');
    if (activeChannel) {
      activeChannel.classList.remove('list-group-item-primary');
    }
    event.target.classList.add('list-group-item-primary');
    renderPosts(state);
  });
};
