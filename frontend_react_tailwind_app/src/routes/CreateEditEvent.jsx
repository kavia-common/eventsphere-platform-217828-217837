import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { TextInput, DateInput, TextArea, Select } from '../components/inputs';
import { CREATE_EVENT_MUTATION, UPDATE_EVENT_MUTATION } from '../graphql/mutations';
import { EVENTS_BROWSE_QUERY } from '../graphql/queries';

/**
 * PUBLIC_INTERFACE
 * CreateEditEvent: Form for creating/editing events using GraphQL.
 * Props:
 * - mode: 'create' | 'edit'
 * - initial: optional event object for edit mode
 * - onSuccess: callback with created/updated event
 */
export default function CreateEditEvent({ mode = 'create', initial = null, onSuccess }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    date: initial?.date || '',
    location: initial?.location || '',
    type: initial?.type || 'in-person',
    description: initial?.description || '',
    tags: initial?.tags?.join(', ') || '',
  });
  const [errors, setErrors] = useState({});

  const [createEvent, { loading: creating }] = useMutation(CREATE_EVENT_MUTATION, {
    refetchQueries: [{ query: EVENTS_BROWSE_QUERY }],
  });

  const [updateEvent, { loading: updating }] = useMutation(UPDATE_EVENT_MUTATION);

  const setField = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title) e.title = 'Title is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.location) e.location = 'Location is required';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length !== 0) return;

    const payload = {
      title: form.title,
      date: form.date,
      location: form.location,
      type: form.type,
      description: form.description,
      tags: form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };

    try {
      let result;
      if (mode === 'edit' && initial?.id) {
        result = await updateEvent({ variables: { id: initial.id, input: payload } });
      } else {
        result = await createEvent({ variables: { input: payload } });
      }
      const ev = result?.data?.createEvent || result?.data?.updateEvent;
      onSuccess?.(ev);
      // eslint-disable-next-line no-alert
      // alert(`${mode === 'edit' ? 'Updated' : 'Created'} event: ${payload.title}`);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Failed to ${mode === 'edit' ? 'update' : 'create'} event: ${err.message}`);
    }
  };

  const busy = creating || updating;

  return (
    <div className="p-1">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">
        {mode === 'edit' ? 'Edit Event' : 'Create Event'}
      </h1>
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
        <TextInput
          label="Tags"
          name="tags"
          value={form.tags}
          onChange={setField('tags')}
          placeholder="comma,separated,tags"
          helper="Comma separated"
        />
        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Event'}
          </button>
          <button
            type="reset"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={() =>
              setForm({ title: '', date: '', location: '', type: 'in-person', description: '', tags: '' })
            }
            disabled={busy}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
