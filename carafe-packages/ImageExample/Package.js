"use strict";

import jQuery from 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import exampleSrc from './lib/example.png';
import jpgSrc from './lib/example.jpeg';
import './lib/HeaderSidebar.css';
import './lib/style.scss';

jQuery(document).ready(function () {
    let myPng = new Image();
    myPng.src = exampleSrc;
    jQuery('#png').append(myPng);

    let myJpg = new Image();
    myJpg.src = jpgSrc;
    jQuery('#jpg').append(myJpg);
});
