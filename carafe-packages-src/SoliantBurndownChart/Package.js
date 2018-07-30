"use strict";

import 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'mustache';
import D3BurndownChart from './lib/D3BurndownChart';
import './lib/style.scss';

import CarafeData from './ExampleData.json';
window.CarafeData = CarafeData;
window.D3BurndownChart = D3BurndownChart;

// import InlineConsole from './../InlineConsole/lib/InlineConsole';
//
// jQuery(document).ready(function () {
//     new InlineConsole({
//         pageWrapperSelector: 'body',
//     });
// });
