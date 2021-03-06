import React, { ChangeEvent, useCallback, useRef } from 'react';
import { FiMail, FiLock, FiUser, FiCamera, FiArrowLeft } from 'react-icons/fi';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import getValidationErrors from '../../utils/getValidationErrors';
import { Link, useHistory } from 'react-router-dom';

import api from '../../services/api';

import { useToast } from '../../hooks/toast';

import Input from '../../components/Input';
import Button from '../../components/Button';

import { Container, Content, AvatarInput } from './styles';
import { useAuth } from '../../hooks/auth';

interface ProfileFormData {
  name: string;
  email: string;
  old_password: string;
  password: string;
  password_confirmation: string;
}

const Profile: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const history = useHistory();

  const { user, updateUser } = useAuth();

  const handleSubmit = useCallback(async (data: ProfileFormData) => {
    try {
      formRef.current?.setErrors({});

      const schema = Yup.object().shape({
        name: Yup.string().required('Name is required'),
        email: Yup.string().required('A valid e-mail is required ').email('Type a valid e-mail'),
        old_password: Yup.string(),
        password: Yup.string().when('old_password', {
          is: val => !!val.length,
          then: Yup.string().required('New password needed'),
          otherwise: Yup.string(),
        }),
        password_confirmation: Yup.string()
        .when('old_password', {
          is: val => !!val.length,
          then: Yup.string().required('Password confirmation needed'),
          otherwise: Yup.string(),
        }).oneOf(
          [Yup.ref('password')],
          'Incorrect confirmation',
        ),
      });

      await schema.validate(data, {
        abortEarly: false,
      });

      const { name, email, old_password, password, password_confirmation } = data;

      const formData = Object.assign({
        name,
        email,
      }, data.old_password ? {
        old_password,
        password,
        password_confirmation,
      }: {});

      const response = await api.put('/profile', formData);

      updateUser(response.data);

      history.push('/dashboard');

      addToast({
        type: 'success',
        title: 'Profile updated!',
        description: 'Your profile informations where done with success!',
      });
    } catch (err) {
      if (err instanceof Yup.ValidationError){
        const errors = getValidationErrors(err);

        formRef.current?.setErrors(errors);

        return;
      }

      // disparar um toast
      addToast({
        type: 'error',
        title: 'Update error',
        description: 'An error has occured while updating your profile, check your credentials and try again.',
      });
    }
  }, [addToast, history]);

  const handleAvatarChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const data = new FormData();

      data.append('avatar', e.target.files[0]);

      api.patch('/users/avatar', data).then((response) => {
        updateUser(response.data);
        console.log(user.avatar_url);

        addToast({
          type: 'success',
          title: 'Avatar changed!',
        });
      });
    }
  }, [addToast, updateUser, user.avatar_url]);

  return (
    <Container>
      <header>
        <div>
          <Link to="/dashboard">
            <FiArrowLeft />
          </Link>
        </div>
      </header>

      <Content>
        <Form ref={formRef} initialData={{
          name: user.name,
          email: user.email,
        }}
        onSubmit={handleSubmit}>
          <AvatarInput>
            <img src={user.avatar_url} alt={user.name}/>
            <label htmlFor="avatar">
              <FiCamera />

              <input type="file" id="avatar" onChange={handleAvatarChange}/>
            </label>
          </AvatarInput>

          <h1>My profile</h1>

          <Input name="name" icon={FiUser} placeholder="Name" />
          <Input name="email" icon={FiMail} placeholder="E-mail" />

          <Input containerStyle={{ marginTop:24 }} name="old_password" icon={FiLock} type="password" placeholder="Password" />
          <Input name="password" icon={FiLock} type="password" placeholder="New password" />
          <Input name="password_confirmation" icon={FiLock} type="password" placeholder="Password confirmation" />

          <Button type="submit">Confirm changes</Button>
        </Form>
      </Content>
    </Container>
  )
};

export default Profile;
