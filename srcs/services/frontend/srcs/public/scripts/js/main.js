"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var app_js_1 = require("./app.js");
document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('app');
    if (container) {
        new app_js_1.App(container);
    }
    else {
        console.error('App container not found');
    }
});
