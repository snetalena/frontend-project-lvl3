import i18next from 'i18next';

const renderFeedback = (elements, feedbackType, feedbackText) => {
  const { feedback } = elements;
  feedback.classList.remove('text-danger', 'text-success');
  feedback.classList.add(feedbackType);
  feedback.textContent = feedbackText;
};

export const renderForm = (state, elements) => {
  const {
    heading, input, button, spinner,
  } = elements;

  button.textContent = i18next.t('mainButton');
  heading.textContent = i18next.t('heading');
  input.value = state.form.inputText;

  input.classList.remove('disabled', 'is-invalid');
  button.classList.remove('disabled');
  spinner.innerHTML = '';

  switch (state.form.processState) {
    case 'filling':
      if (!state.form.valid) {
        button.classList.add('disabled');
        input.classList.add('is-invalid');
        renderFeedback(elements, 'text-danger', i18next.t(`messages.${state.errors.message}`));
        return;
      }
      renderFeedback(elements, 'text-success', '');
      break;

    case 'sending':
      button.classList.add('disabled');
      input.classList.add('disabled');
      spinner.innerHTML = `<strong>Loading...</strong>
      <div class="spinner-border ml-auto" role="status" aria-hidden="true"></div>`;
      break;

    case 'failed':
      renderFeedback(elements, 'text-danger', i18next.t('messages.errorRequest', { code: state.errors.message }));
      break;

    case 'successed':
      renderFeedback(elements, 'text-success', i18next.t('messages.successLoad'));
      break;

    default:
      throw new Error(`Unknown : RSSprocess.state '${state.form.processState}'!`);
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

export const renderChannels = (state, elements) => {
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
    activeChannel.classList.remove('list-group-item-primary');
    event.target.classList.add('list-group-item-primary');
    renderPosts(state, elements);
  });
};
