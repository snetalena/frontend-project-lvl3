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

  const parentInput = elements.elementInput.parentElement;
  const invalidDiv = parentInput.querySelector('div.invalid-feedback');
  elements.elementInput.classList.remove('is-invalid');
  elements.elementButton.classList.remove('disabled');

  // if (state.form.inputField.valid && state.form.inputField.text !== '') {
  //   elementInput.classList.add('is-valid');
  // } else {
  //   elementInput.classList.add('is-invalid');
  // }
  elements.elementInput.value = state.form.inputField.text;
  if (!state.form.inputField.valid) {
    elements.elementInput.classList.add('is-invalid');
  }
  if (invalidDiv) {
    invalidDiv.remove();
  }
  if (state.form.messageCode) {
    const newInvalidDiv = document.createElement('div');
    newInvalidDiv.classList.add('invalid-feedback');
    newInvalidDiv.textContent = i18next.t(`errorMessages.${state.form.messageCode}`);
    parentInput.append(newInvalidDiv);
  }
  if (!state.form.submitActive || state.form.inputField.text === '') {
    elements.elementButton.classList.add('disabled');
  }
};

export const renderPosts = (state, elements) => {
  elements.elementPosts.innerHTML = '';
  const activeChannel = elements.elementChannels.querySelector('.active');
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
  allChannel.classList.add('list-group-item', 'list-group-item-action', 'active');
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
    const activeChannel = ulChannels.querySelector('.active');
    if (activeChannel) {
      activeChannel.classList.remove('active');
    }
    event.target.classList.add('active');
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
