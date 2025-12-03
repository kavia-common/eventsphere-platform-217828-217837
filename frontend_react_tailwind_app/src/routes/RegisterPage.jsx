import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput } from '../components/inputs';

/**
 * PUBLIC_INTERFACE
 * RegisterPage: Simple registration UI scaffold. Replace with real mutation flow.
 */
export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Replace with GraphQL mutation to register, then redirect to login
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Create your account</h1>
      <form onSubmit={handleSubmit} className="space-y-4 card p-4">
        <TextInput label="Name" name="name" value={form.name} onChange={setField('name')} />
        <TextInput label="Email" name="email" type="email" value={form.email} onChange={setField('email')} />
        <TextInput label="Password" name="password" type="password" value={form.password} onChange={setField('password')} />
        <button type="submit" className="btn-primary w-full">Register</button>
      </form>
    </div>
  );
}
