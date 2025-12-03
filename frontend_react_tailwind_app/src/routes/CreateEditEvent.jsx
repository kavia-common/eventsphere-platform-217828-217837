import React, { useState } from 'react';
import { TextInput, DateInput, TextArea, Select } from '../components/inputs';

/**
 * PUBLIC_INTERFACE
 * CreateEditEvent: Form scaffold for creating/editing events.
 * Props: mode = 'create' | 'edit'
 */
export default function CreateEditEvent({ mode = 'create' }) {
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    type: 'in-person',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const setField = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title) e.title = 'Title is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.location) e.location = 'Location is required';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length === 0) {
      // Replace with GraphQL mutation for create or update
      alert(`${mode === 'edit' ? 'Updated' : 'Created'} event: ${form.title}`);
    }
  };

  return (
    <div className="p-1">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">{mode === 'edit' ? 'Edit Event' : 'Create Event'}</h1>
      <form id="create-edit-event-form" onSubmit={submit} className="space-y-4">
        <TextInput label="Title" name="title" value={form.title} onChange={setField('title')} error={errors.title} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateInput label="Date" name="date" value={form.date} onChange={setField('date')} type="date" error={errors.date} />
          <TextInput label="Location" name="location" value={form.location} onChange={setField('location')} error={errors.location} />
        </div>
        <Select
          label="Type"
          name="type"
          value={form.type}
          onChange={setField('type')}
          options={[
            { value: 'in-person', label: 'In-person' },
            { value: 'online', label: 'Online' },
            { value: 'hybrid', label: 'Hybrid' },
          ]}
          helper="Select the format"
        />
        <TextArea
          label="Description"
          name="description"
          value={form.description}
          onChange={setField('description')}
          rows={5}
          helper="Agenda, speakers, requirements..."
        />
        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary">{mode === 'edit' ? 'Save Changes' : 'Create Event'}</button>
          <button
            type="reset"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={() => setForm({ title: '', date: '', location: '', type: 'in-person', description: '' })}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
