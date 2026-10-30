// Importing this registers every Mongoose model, so .populate() works in any
// route no matter which models that route imports itself.
export { default as User } from "./User";
export { default as Course } from "./Course";
export { default as Question } from "./Question";
export { default as Attempt } from "./Attempt";
