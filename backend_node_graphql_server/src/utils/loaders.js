import DataLoader from 'dataloader';
import mongoose from 'mongoose';
import { User, Event } from '../models/index.js';
import getLogger from './logger.js';

const log = getLogger().child({ mod: 'dataloader' });

/**
 * PUBLIC_INTERFACE
 * createUserLoader: Batch load Users by ObjectId with identity map ordering.
 */
export function createUserLoader() {
  return new DataLoader(async (ids) => {
    const objectIds = ids
      .filter(Boolean)
      .map((id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id));
    const docs = await User.find({ _id: { $in: objectIds } }).lean();
    const map = new Map(docs.map((d) => [String(d._id), d]));
    return ids.map((id) => map.get(String(id)) || null);
  });
}

/**
 * PUBLIC_INTERFACE
 * createEventLoader: Batch load Events by ObjectId with identity map ordering.
 */
export function createEventLoader() {
  return new DataLoader(async (ids) => {
    const objectIds = ids
      .filter(Boolean)
      .map((id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id));
    const docs = await Event.find({ _id: { $in: objectIds } }).lean();
    const map = new Map(docs.map((d) => [String(d._id), d]));
    return ids.map((id) => map.get(String(id)) || null);
  });
}

/**
 * PUBLIC_INTERFACE
 * createLoaders: factory returning all loaders, scoped per-request.
 */
export function createLoaders() {
  const loaders = {
    userById: createUserLoader(),
    eventById: createEventLoader(),
  };
  log.debug('Loaders created');
  return loaders;
}

export default createLoaders;
