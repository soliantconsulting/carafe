"use strict";

import 'jquery';
import InlineConsole from './lib/InlineConsole';
import carafeData from './ExampleData.json';

window.carafeData = carafeData;

jQuery(document).ready(function () {
    new InlineConsole({
        pageWrapperSelector: 'main.container',
        navBar: 'nav.navbar',
    });
});
