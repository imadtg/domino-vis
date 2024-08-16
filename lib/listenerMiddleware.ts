import {
  createListenerMiddleware,
  addListener,
} from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "./store";


// Create the middleware instance and methods
const listenerMiddleware = createListenerMiddleware();

export const addAppListener = addListener.withTypes<RootState, AppDispatch>();

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

export default listenerMiddleware;
