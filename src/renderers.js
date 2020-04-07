import i18next from 'i18next';
import resources from './locales';

export const renderForm = (state, elements) => {
  i18next.init({
    lng: 'en', // Текущий язык
    debug: true,
    resources,
    //   en: {
    //     translation: {
    //       mainButton: 'OK',
    //       heading: 'RSS aggregator',
    //     },
    //   },
    // },
  }).then(t => {
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

export const renderChannels = (state, elements) => {
  // elements.elementLists.innerHTML = '';
  elements.elementChannels.innerHTML = '';
  elements.elementPosts.innerHTML = '';

  const ulChannels = document.createElement('ul');
  state.channels.forEach((channel) => {
    const liChannel = document.createElement('li');
    // liChannel.textContent = `id: ${channel.id}, title: ${channel.title}, desc: ${channel.description}, link: ${channel.link}`;
    liChannel.textContent = `${channel.title}: ${channel.description}`;
    ulChannels.appendChild(liChannel);
  });
  elements.elementChannels.append(ulChannels);

  const ulPosts = document.createElement('ul');
  ulPosts.classList.add('list-group');
  state.posts.forEach((post) => {
    const liPost = document.createElement('li');
    liPost.classList.add('list-group-item');
    const link = document.createElement('a');
    link.setAttribute('href', post.link);
    link.textContent = post.title;
    liPost.append(link);
    ulPosts.appendChild(liPost);
    elements.elementPosts.append(ulPosts);
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
