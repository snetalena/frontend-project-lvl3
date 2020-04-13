import i18next from 'i18next';
import resources from './locales';

export const renderForm = (state, elements) => {
  i18next.init({
    lng: 'en', // Текущий язык
    debug: true,
    resources,
  }).then(() => {
    elements.elementButton.textContent = i18next.t('mainButton');
    elements.elementHeading.textContent = i18next.t('heading');
  });

  // const parentInput = elements.elementInput.parentElement;
  // const invalidDiv = parentInput.querySelector('div.invalid-feedback');
  elements.elementInput.classList.remove('is-invalid');
  elements.elementButton.classList.remove('disabled');

  if (!state.form.submitActive || state.form.inputField.text === '') {
    elements.elementButton.classList.add('disabled');
  }

  elements.elementInput.value = state.form.inputField.text;

  if (!state.form.inputField.valid && state.form.inputField.text !== '') {
    elements.elementInput.classList.add('is-invalid');
  }

  // if (invalidDiv) {
  //   invalidDiv.remove();
  // }
  const newDiv = elements.elementFeedback;
  while (newDiv.classList.length > 0) {
    newDiv.classList.remove(newDiv.classList.item(0));
  }
  newDiv.innerHTML = '';

  if (state.form.message.code) {
    // const newDiv = document.createElement('div');
    newDiv.innerHTML = '';
    if (state.form.message.type === 'success') {
      newDiv.classList.add('feedback', 'text-success');
    } else {
      newDiv.classList.add('invalid-feedback');
    }
    newDiv.textContent = state.form.message.type === 'errorRequest'
      ? i18next.t('messages.errorRequest', { code: state.form.message.code })
      : i18next.t(`messages.${state.form.message.code}`);
    // parentInput.append(newDiv);
  }

};

export const renderPosts = (state, elements) => {
  elements.elementPosts.innerHTML = '';
  const activeChannel = elements.elementChannels.querySelector('.list-group-item-primary');
  const activeChannelId = activeChannel.getAttribute('id');
  const activePosts = activeChannelId === 'all'
    ? state.posts
    : state.posts.filter((post) => post.channelId === activeChannelId);

  const ulPosts = document.createElement('ul');
  ulPosts.classList.add('list-group');
  activePosts.forEach((post) => {
    const liPost = document.createElement('li');
    liPost.classList.add('list-group-item');
    const link = document.createElement('a');
    link.setAttribute('href', post.link);
    link.textContent = post.title;
    liPost.setAttribute('channelId', post.channelId);
    liPost.append(link);
    ulPosts.appendChild(liPost);
    elements.elementPosts.append(ulPosts);
  });
};

export const renderChannels = (state, elements) => {
  elements.elementChannels.innerHTML = '';

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
  elements.elementChannels.append(ulChannels);

  ulChannels.addEventListener('click', (event) => {
    const activeChannel = ulChannels.querySelector('.list-group-item-primary');
    if (activeChannel) {
      activeChannel.classList.remove('list-group-item-primary');
    }
    event.target.classList.add('list-group-item-primary');
    renderPosts(state, elements);
  });
};

export const renderSpinner = (state, elements) => {
  if (state.statusForm === 'loading') {
    const div = document.createElement('div');
    div.innerHTML = `<strong>Loading...</strong>
      <div class="spinner-border ml-auto" role="status" aria-hidden="true"></div>`;
    div.classList.add('d-flex', 'align-items-centr', 'pt-3', 'pr-3');
    elements.elementForm.append(div);
  }
  if (state.statusForm === 'filling') {
    const elementSpinner = elements.elementForm.querySelector('.d-flex');
    elementSpinner.remove();
  }
};
