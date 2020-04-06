export const renderForm = (state, elements) => {
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
  if (state.form.message.error) {
    const newInvalidDiv = document.createElement('div');
    newInvalidDiv.classList.add('invalid-feedback');
    newInvalidDiv.textContent = state.form.message.text;
    parentInput.append(newInvalidDiv);
  }
  if (!state.form.submitActive || state.form.inputField.text === '') {
    elements.elementButton.classList.add('disabled');
  }
};

export const renderChannels = (state, elements) => {
  elements.elementLists.innerHTML = '';

  const elementChannels = document.createElement('ul');
  state.channels.forEach((channel) => {
    const elementChannel = document.createElement('li');
    elementChannel.textContent = `id: ${channel.id}, title: ${channel.title}, desc: ${channel.description}, link: ${channel.link}`;
    elementChannels.appendChild(elementChannel);
  });
  elements.elementLists.append(elementChannels);

  const elementPosts = document.createElement('ul');
  state.posts.forEach((post) => {
    const elementPost = document.createElement('li');
    const link = document.createElement('a');
    link.setAttribute('href', post.link);
    link.textContent = post.title;
    elementPost.append(link);
    elementPosts.appendChild(elementPost);
    elements.elementLists.append(elementPosts);
  });
};

export const renderSpinner = (state, elements) => {
  if (state.statusForm === 'loading') {
    const div = document.createElement('div');
    div.innerHTML = `<strong>Loading...</strong>
      <div class="spinner-border ml-auto" role="status" aria-hidden="true"></div>`;
    div.classList.add('d-flex', 'align-items-center');
    elements.elementJumb.append(div);
  }
  if (state.statusForm === 'filling') {
    const elementSpinner = elements.elementJumb.querySelector('.d-flex');
    elementSpinner.remove();
  }
};
