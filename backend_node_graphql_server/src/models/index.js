import User from './User.js';
import Event from './Event.js';
import Registration from './Registration.js';
import Message from './Message.js';

/**
 * PUBLIC_INTERFACE
 * getModels: Returns all registered Mongoose models used by the application.
 * Useful for dependency injection and testing.
 */
export function getModels() {
  return { User, Event, Registration, Message };
}

export { User, Event, Registration, Message };
export default { User, Event, Registration, Message, getModels };
