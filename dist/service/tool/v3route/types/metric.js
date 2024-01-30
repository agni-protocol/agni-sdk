"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metric = void 0;
const Tool_1 = require("../../Tool");
function metric(...args) {
    Tool_1.Trace.debug(...args);
}
exports.metric = metric;
