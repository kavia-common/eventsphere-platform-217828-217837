import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput } from '../components/inputs';
import { useMutation } from '@apollo/client';
import { REGISTER_MUTATION } from '../graphql/mutations';

/**
 * PUBLIC_INTERFACE
 * RegisterPage: Registration flow using GraphQL mutation.
 */
export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [registerMutation, { loading }] = useMutation(REGISTER_MUTATION, {
    onError: (networkError) => {
      // eslint-disable-next-line no-console
      console.error('[register] Network/Apollo error:', networkError);
    },
  });
  const navigate = useNavigate();

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerMutation({ variables: { input: form } });
      navigate('/login');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[register] Mutation failed', {
        message: err?.message,
        name: err?.name,
        networkError: err?.networkError,
        graphQLErrors: err?.graphQLErrors,
      });
      // eslint-disable-next-line no-alert
      alert(`Registration failed: ${err?.message || 'Unexpected error'}`);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Create your account</h1>
      <form onSubmit={handleSubmit} className="space-y-4 card p-4">
        <TextInput label="Name" name="name" value={form.name} onChange={setField('name')} />
        <TextInput label="Email" name="email" type="email" value={form.email} onChange={setField('email')} />
        <TextInput label="Password" name="password" type="password" value={form.password} onChange={setField('password')} />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Registering…' : 'Register'}
        </button>
      </form>
    </div>
  );
}
