import React from "react";
import { render } from "ink";
import { checkAuth } from "./lib/github";
import App from "./app";

checkAuth();

render(<App />);
