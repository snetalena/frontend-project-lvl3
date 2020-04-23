export const renderForm = (state, elements, i18next) => {
  const {
    heading, input, button, feedback, spinner,
  } = elements;

  button.textContent = i18next.t('mainButton');
  heading.textContent = i18next.t('heading');
  input.classList.remove('is-invalid');
  input.classList.remove('disabled');
  input.value = state.form.inputText;
  button.classList.remove('disabled');
  spinner.innerHTML = '';
  while (feedback.classList.length > 0) {
    feedback.classList.remove(elements.feedback.classList.item(0));
  }
  feedback.innerHTML = '';

  switch (state.RSSprocess.state) {
    case 'filling':
      if (!state.form.valid) {
        button.classList.add('disabled');
        input.classList.add('is-invalid');
        feedback.textContent = i18next.t(`messages.${state.RSSprocess.error}`);
        elements.feedback.classList.add('feedback', 'text-danger', 'pt-2');
      }
      break;
    case 'sending':
      button.classList.add('disabled');
      input.classList.add('disabled');
      spinner.innerHTML = `<strong>Loading...</strong>
      <div class="spinner-border ml-auto" role="status" aria-hidden="true"></div>`;
      break;
    case 'failed':
      feedback.textContent = i18next.t('messages.errorRequest', { code: state.RSSprocess.error });
      feedback.classList.add('feedback', 'text-danger', 'pt-2');
      break;
    case 'successed':
      feedback.textContent = i18next.t('messages.successLoad');
      feedback.classList.add('feedback', 'text-success', 'pt-2');
      break;
    default:
      throw new Error(`Unknown : RSSprocess.state '${state.RSSprocess.state}'!`);
  }
};

export const renderPosts = (state, elements) => {
  const { posts, channels } = elements;
  posts.innerHTML = '';
  if (state.posts.length === 0) {
    return;
  }
  const activeChannel = channels.querySelector('.list-group-item-primary');
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
  posts.append(ulPosts);
};

export const renderChannels = (state, elements, i18next) => {
  const { channels } = elements;
  channels.innerHTML = '';
  if (state.channels.length === 0) return;
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
  channels.append(ulChannels);
  ulChannels.addEventListener('click', (event) => {
    const activeChannel = ulChannels.querySelector('.list-group-item-primary');
    if (activeChannel) {
      activeChannel.classList.remove('list-group-item-primary');
    }
    event.target.classList.add('list-group-item-primary');
    renderPosts(state);
  });
};
