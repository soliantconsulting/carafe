"use strict";

import 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import './lib/basscss.css';
import sortable from 'html5sortable/dist/html5sortable.es';
import GroupItemOrganizer from "./lib/GroupItemOrganizer";
import './lib/style.css';

// import data
import carafeData from './ExampleData.json';

// add additional data
let index = 102;
for (let g = 1; g <= 5; g++) {
    for (let i = 1; i < 3; i++) {
        carafeData.push({
            "group": g,
            "id":index++,
            "item":654654,
            "quantity":22,
            "orderNumber":23423452523
        });
    }
}

window.sortable = sortable;
window.carafeData = carafeData;
window.GroupItemOrganizer = GroupItemOrganizer;
